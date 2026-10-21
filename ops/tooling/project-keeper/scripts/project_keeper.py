#!/usr/bin/env python3
"""Project Keeper deterministic helpers. Python 3.9+, standard library only.

Semantic decisions and real code/test execution belong to the Agent. JSON output
does not certify facts: recorded execution and acceptance are caller attestations.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import sys
import tempfile
import uuid

TEMPLATES = Path(__file__).resolve().parent.parent / "assets" / "templates"
PROJECT_DOCS = ("index.md", "project-brief.md", "architecture.md", "rules.md", "roadmap.md", "log.md")
VERSION_DOCS = ("requirements.md", "spec.md", "test-plan.md", "test-results.md")
VERSION = re.compile(r"V(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\Z")
IDENTIFIER = re.compile(r"[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}\Z")
STATE = re.compile(r"^<!-- pjkp:state (.+) -->$", re.M)
START, END = "<!-- pjkp:versions:start -->", "<!-- pjkp:versions:end -->"
LOG_META = re.compile(r"^<!-- pjkp:log (.+) -->$", re.M)
ROADMAP_SECTIONS = ("愿景与长期规划", "里程碑", "todo")


class KeeperError(ValueError):
    pass


def fail(message):
    raise KeeperError(message)


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def encode(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def checked_id(value):
    if not isinstance(value, str) or not IDENTIFIER.fullmatch(value):
        fail("标识须为 1–120 位 ASCII 字母/数字及 _ . : -，首位为字母或数字")
    return value


def checked_version(value):
    if not VERSION.fullmatch(value):
        fail("版本名须由用户提供，格式 Vx.x（非负整数，无多余前导零）")
    return value


def safe(base, relative):
    """Reject all symlink components, not merely currently escaping links."""
    if not isinstance(relative, str) or "\\" in relative:
        fail("非法相对路径")
    rel = PurePosixPath(relative)
    if rel.is_absolute() or not rel.parts or any(p in ("", ".", "..") for p in relative.split("/")):
        fail("路径必须相对于项目且不得含 . 或 ..")
    if any(ord(c) < 32 for c in relative):
        fail("路径含控制字符")
    base = Path(base).resolve()
    current = base
    for part in rel.parts:
        current = current / part
        if current.is_symlink():
            fail("不跟随受管理路径中的符号链接: " + str(current))
    try:
        current.resolve().relative_to(base)
    except ValueError:
        fail("路径越界")
    return current


def root_path(project=None, cwd=None):
    if project is not None:
        root = Path(project).expanduser().resolve()
        if not root.is_dir():
            fail("项目根目录不存在")
        safe(root, "pjkp")
        return root
    current = Path(cwd or Path.cwd()).resolve()
    candidates = [p for p in (current, *current.parents) if (p / "pjkp").exists() or (p / "pjkp").is_symlink()]
    if len(candidates) != 1:
        fail("无法唯一定位项目，请传 --project。候选: " + str([str(p) for p in candidates]))
    safe(candidates[0], "pjkp")
    return candidates[0]


def path(root, relative):
    if not isinstance(relative, str) or PurePosixPath(relative).is_absolute():
        fail("受管理路径必须相对于 pjkp")
    return safe(root, "pjkp/" + relative)


def read(root, relative):
    return path(root, relative).read_text(encoding="utf-8")


def write(root, relative, text, expected=None):
    """Per-file atomic replacement and optimistic check; not a multi-file tx."""
    target = path(root, relative)
    target.parent.mkdir(parents=True, exist_ok=True)
    if expected is not None and (not target.is_file() or digest(target.read_text(encoding="utf-8")) != expected):
        fail("写入依据已变化: " + relative)
    fd, name = tempfile.mkstemp(prefix=".pjkp-write-", dir=str(target.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="") as stream:
            stream.write(text)
            stream.flush()
            os.fsync(stream.fileno())
        # Repeat the check immediately before replacement. External editors do
        # not honor our lock; adversarial race-free multi-user editing is not claimed.
        path(root, relative)
        if expected is not None and digest(target.read_text(encoding="utf-8")) != expected:
            fail("写入前发生并发编辑: " + relative)
        os.replace(name, target)
    finally:
        if os.path.exists(name):
            os.unlink(name)


@contextmanager
def lock(root):
    folder = safe(root, "pjkp")
    folder.mkdir(exist_ok=True)
    target = path(root, ".write.lock")
    try:
        fd = os.open(target, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        fail("pjkp 写入锁已存在；先确认是否有运行中进程，异常退出后须人工核实再移除锁")
    try:
        with os.fdopen(fd, "w") as stream:
            stream.write(encode({"pid": os.getpid(), "time": now()}))
        yield
    finally:
        target.unlink()


def headings(text, level=None):
    result, fence = [], None
    for number, line in enumerate(text.splitlines(), 1):
        marker = re.match(r"^\s*(`{3,}|~{3,})", line)
        if marker:
            char = marker[1][0]
            fence = None if fence == char else char if fence is None else fence
            continue
        match = re.match(r"^(#{1,6})\s+(.+?)\s*$", line)
        if match and fence is None and (level is None or len(match[1]) == level):
            result.append({"level": len(match[1]), "title": match[2], "line": number})
    return result


def section(text, title):
    items = headings(text)
    matches = [h for h in items if h["title"] == title]
    if len(matches) != 1:
        fail("章节不存在或不唯一: " + title)
    item = matches[0]
    end = next((h["line"] - 1 for h in items if h["line"] > item["line"] and h["level"] <= item["level"]), len(text.splitlines()))
    return "\n".join(text.splitlines()[item["line"] - 1:end]) + "\n"


def render(name, project, version=""):
    return (TEMPLATES / name).read_text(encoding="utf-8").replace("{{project}}", project).replace("{{version}}", version)


def roadmap_parts(text):
    """Normalize only the legacy heading, never rewrite planning content."""
    items = headings(text, 2)
    parts = {}
    for item in items:
        title = "todo" if item["title"] == "短期待办" else item["title"]
        if title in parts or title not in ROADMAP_SECTIONS:
            fail("roadmap 模块重复或未知")
        content = section(text, item["title"])
        parts[title] = "\n".join(content.splitlines()[1:]).strip()
    if tuple(parts) != ROADMAP_SECTIONS:
        fail("roadmap 须保留愿景与长期规划、里程碑、todo 三个模块")
    prefix = "\n".join(text.splitlines()[:items[0]["line"] - 1]).strip()
    return prefix, parts


def checked_roadmap_sources(sources):
    if not isinstance(sources, dict) or set(sources) - set(ROADMAP_SECTIONS):
        fail("规划 sources 须按愿景与长期规划、里程碑、todo 提供")
    for title, evidence in sources.items():
        if not isinstance(evidence, dict) or any(
            not isinstance(evidence.get(key), str) or not evidence[key].strip()
            for key in ("statement", "source")
        ):
            fail("规划模块需要用户原话 statement 与来源 source: " + title)
    return sources


def check_roadmap_change(before, after, sources=None):
    sources = checked_roadmap_sources({} if sources is None else sources)
    old_prefix, old = roadmap_parts(before)
    new_prefix, new = roadmap_parts(after)
    if old_prefix != new_prefix:
        fail("受控规划更新只修改模块正文，不改标题前的内容")
    changed = [title for title in ROADMAP_SECTIONS if old[title] != new[title]]
    if set(changed) - set(sources):
        fail("规划变更缺少用户来源: " + ", ".join(sorted(set(changed) - set(sources))))
    return changed


def update_roadmap(root, event, proposal):
    checked_id(event)
    if not isinstance(proposal, dict):
        fail("规划提案须为 JSON 对象")
    after, expected = proposal.get("after"), proposal.get("before_sha256")
    summary = proposal.get("summary")
    if not isinstance(after, str) or not isinstance(expected, str) or not re.fullmatch(r"[0-9a-f]{64}", expected):
        fail("规划提案需要目标全文与有效的 before_sha256")
    if not isinstance(summary, str) or not summary.strip() or "<!-- pjkp:" in summary:
        fail("规划提案需要非空摘要且不能含保留标记")
    sources = checked_roadmap_sources(proposal.get("sources", {}))
    validate_doc("roadmap.md", after)
    body = "- 用户来源：" + encode(sources) + "\n- 摘要：" + summary
    body += "\n- 前指纹：" + expected + "\n- 后指纹：" + digest(after)
    if "<!-- pjkp:" in body:
        fail("规划来源不能包含日志保留标记")
    if any(meta["id"] == event for meta, _ in log_entries(read(root, "log.md"))):
        append_log(root, event, "roadmap-update", body)
        return {"updated": False, "replayed": True, "id": event}
    before = read(root, "roadmap.md")
    if digest(before) == expected:
        check_roadmap_change(before, after, sources)
    elif before != after:
        fail("规划写入依据已变化；重新读取并核对，不覆盖后续编辑")
    elif not sources:
        fail("恢复规划日志仍须保留原用户来源")
    changed = before != after
    if changed:
        write(root, "roadmap.md", after, digest(before))
    # A retry with the identical proposal repairs a log failure after writing.
    append_log(root, event, "roadmap-update", body)
    return {"updated": changed, "id": event}


def validate_doc(name, text):
    if name == "log.md":
        if len(headings(text, 1)) != 1:
            fail("log 须有一个一级标题")
        seen = set()
        for meta, _ in log_entries(text):
            if meta["id"] in seen:
                fail("重复日志 id")
            seen.add(meta["id"])
        return
    expected = [h["title"] for h in headings((TEMPLATES / name).read_text(encoding="utf-8"), 2)]
    found = [h["title"] for h in headings(text, 2)]
    if name == "roadmap.md":
        found = ["todo" if title == "短期待办" else title for title in found]
    if expected != found:
        fail(name + " 二级模块须依模板保留: " + str(expected))
    if len(headings(text, 1)) != 1:
        fail(name + " 须有且仅有一个一级标题")
    if name == "project-brief.md":
        intro = section(text, "项目介绍")
        if [h["title"] for h in headings(intro, 3)] != ["项目定位", "项目概要", "项目价值"]:
            fail("项目介绍须包含定位、概要、价值三个子模块")
    if "{{project}}" in text or "{{version}}" in text:
        fail("未替换模板对象")


def init(root, name):
    if not name.strip() or any(c in name for c in "\n\r<>"):
        fail("请提供有效的单行项目名；不能推测")
    created, reused = [], []
    for item in (*PROJECT_DOCS, "config.toml"):
        target = path(root, item)
        if target.exists():
            if not target.is_file():
                fail("目标不是文件: " + item)
            reused.append(item)
        else:
            write(root, item, render(item, name))
            created.append(item)
    return {"created": created, "reused": reused, "next": "读取复用文件，填写真实信息，再 log project-initiate；骨架不代表完成"}


def get_state(text):
    matches = STATE.findall(text)
    if len(matches) != 1:
        fail("requirements 缺少或重复 pjkp:state；请核查，不猜测状态")
    state = json.loads(matches[0])
    checked_version(state["version"])
    return state


def put_state(text, state):
    line = "<!-- pjkp:state " + encode(state) + " -->"
    if STATE.search(text):
        return STATE.sub(lambda _: line, text, count=1)
    return line + "\n" + text


def states(root):
    result = {}
    for folder in sorted(safe(root, "pjkp").iterdir()):
        if VERSION.fullmatch(folder.name):
            target = path(root, folder.name + "/requirements.md")
            result[folder.name] = get_state(target.read_text(encoding="utf-8"))
            if result[folder.name]["version"] != folder.name:
                fail("版本目录与状态标识不一致: " + folder.name)
    return result


def index_text(root, overrides=None):
    text = read(root, "index.md")
    if text.count(START) != 1 or text.count(END) != 1 or text.index(START) > text.index(END):
        fail("index 缺少或重复版本导航边界")
    versions = states(root)
    versions.update(overrides or {})
    closed = [(s.get("closed_at", ""), v) for v, s in versions.items() if s.get("closed_by")]
    latest = max(closed)[1] if closed else "暂无"
    lines = ["最近完成版本：" + latest, "", "| 版本 | 状态 | 来源 |", "| --- | --- | --- |"]
    for v, s in versions.items():
        lines.append(f"| {v} | {s['phase']} | [需求]({v}/requirements.md) |")
    if not versions:
        lines = ["暂无版本。"]
    return text[:text.index(START) + len(START)] + "\n" + "\n".join(lines) + "\n" + text[text.index(END):]


def sync_index(root):
    before = read(root, "index.md")
    after = index_text(root)
    if after != before:
        write(root, "index.md", after, digest(before))
    return {"updated": before != after}


def create_version(root, version, name):
    checked_version(version)
    target = path(root, version + "/requirements.md")
    if target.exists():
        state = get_state(read(root, version + "/requirements.md"))
        if state.get("closed_by"):
            fail("已关闭版本不能直接续接；先决定新版本或 undo")
        return {"created": False, "version": version, "next": "先读取并续接，不覆盖"}
    text = put_state(render("requirements.md", name, version), {"version": version, "phase": "requirements", "code": None, "test": None, "closed_by": None})
    write(root, version + "/requirements.md", text)
    sync_index(root)
    return {"created": True, "version": version, "next": "填写需求并记录 version-create 行为"}


def scaffold(root, version, name, filename):
    checked_version(version)
    if filename not in VERSION_DOCS[1:]:
        fail("只能按阶段生成 spec/test-plan/test-results")
    state = get_state(read(root, version + "/requirements.md"))
    if state.get("closed_by"):
        fail("版本已关闭")
    target = path(root, version + "/" + filename)
    if target.exists():
        return {"created": False, "next": "读取已有材料并续接"}
    write(root, version + "/" + filename, render(filename, name, version))
    return {"created": True, "next": "模板不是已完成的执行或测试"}


def log_entries(text):
    matches = list(LOG_META.finditer(text))
    result = []
    for i, match in enumerate(matches):
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        result.append((json.loads(match[1]), text[match.start():end]))
    return result


def append_log(root, event, action, body, version=None, parent=None, outcome="completed", timestamp=None):
    checked_id(event)
    checked_id(action)
    if version:
        checked_version(version)
    if parent:
        checked_id(parent)
    if not isinstance(body, str) or not body.strip() or "<!-- pjkp:" in body:
        fail("日志正文不能为空或含保留标记")
    body = body.strip()
    payload = {"id": event, "action": action, "version": version, "parent": parent, "outcome": outcome, "body": body}
    checksum = digest(encode(payload))
    text = read(root, "log.md")
    for meta, _ in log_entries(text):
        if meta["id"] == event:
            if meta["sha256"] != checksum:
                fail("同一日志 id 的内容不同；新行为用新 id，更正另记")
            return {"appended": False, "id": event}
    meta = {k: v for k, v in payload.items() if k != "body"}
    meta.update({"time": timestamp or now(), "sha256": checksum})
    record = "\n<!-- pjkp:log " + encode(meta) + " -->\n"
    record += f"## {meta['time']} — {action} — {version or 'project'}\n\n{body.strip()}\n"
    write(root, "log.md", text.rstrip() + "\n" + record, digest(text))
    return {"appended": True, "id": event}


def requirement_basis(text):
    # Closing changes state/result, not the accepted requirement basis.
    return STATE.sub("", text).split("## 版本结果", 1)[0].strip()


def basis(root, version, kind):
    result = {version + "/requirements.md": digest(requirement_basis(read(root, version + "/requirements.md")))}
    for item in (("spec.md",) if kind == "code" else ("spec.md", "test-plan.md", "test-results.md")):
        result[version + "/" + item] = digest(read(root, version + "/" + item))
    return result


def source_hashes(root, files):
    result = {}
    for filename in files:
        if filename.split("/")[0] == "pjkp":
            fail("implementation 必须指向 pjkp 外的实际实现/约束文件")
        target = safe(root, filename)
        if not target.is_file():
            fail("实现文件不存在: " + filename)
        result[filename] = hashlib.sha256(target.read_bytes()).hexdigest()
    if not result:
        fail("必须显式列出本轮实现依据文件")
    return result


def readiness(root, version, state=None):
    state = state or get_state(read(root, version + "/requirements.md"))
    issues = []
    for kind in ("code", "test"):
        event = state.get(kind)
        if not event:
            issues.append(kind + " 尚无完成记录")
            continue
        try:
            if event["basis"] != basis(root, version, kind):
                issues.append(kind + " 需求/方案/证据发生变化")
            if event["implementation"] != source_hashes(root, event["implementation"]):
                issues.append(kind + " 实现文件发生变化")
        except (OSError, KeeperError) as exc:
            issues.append(kind + " 依据缺失: " + str(exc))
    if state.get("code") and state.get("test") and state["test"].get("code_id") != state["code"]["id"]:
        issues.append("测试不是当前代码执行批次")
    return issues


def record(root, version, kind, event, body, implementation=None, parent=None):
    checked_version(version)
    checked_id(event)
    rel = version + "/requirements.md"
    original = read(root, rel)
    state = get_state(original)
    if state.get("closed_by"):
        fail("版本已关闭")
    if kind == "test":
        if not state.get("code") or any(i.startswith("code ") for i in readiness(root, version, state)):
            fail("须先完成并记录当前 code-execute")
        implementation = list(state["code"]["implementation"])
    capture = {"id": event, "basis": basis(root, version, kind), "implementation": source_hashes(root, implementation or [])}
    if kind == "test":
        capture["code_id"] = state["code"]["id"]
    # A retry with the same record id may repair state after logging, but cannot
    # silently recertify changed evidence using an old behavior id.
    old = state.get(kind)
    if old and old["id"] == event and old != capture:
        fail("执行 id 已使用且依据变化；请核查并为新行为使用新 id")
    # Append first: if interrupted, repeat with same payload to finish state.
    details = body + "\n\n- 执行依据：" + encode(capture)
    append_log(root, event, kind + "-execute", details, version, parent)
    if old != capture:
        state[kind] = capture
        if kind == "code":
            state["test"] = None
        state["phase"] = "implemented" if kind == "code" else "awaiting-acceptance"
        write(root, rel, put_state(original, state), digest(original))
    sync_index(root)
    return {"recorded": kind, "version": version, "warning": "执行完成是调用者据证据记录，不代表全部测试通过或用户验收"}


def operation_rel(version, operation):
    checked_version(version)
    checked_id(operation)
    if ":" in operation or len(operation) > 80:
        fail("操作目录标识不能含冒号且不能超过 80 字符")
    return f"{version}/.operations/{operation}/operation.json"


def save_operation(root, op):
    write(root, operation_rel(op["version"], op["id"]), encode(op) + "\n")


def load_operation(root, version, operation):
    op = json.loads(read(root, operation_rel(version, operation)))
    if op["version"] != version or op["id"] != operation:
        fail("操作记录与路径不一致")
    allowed = {"project-brief.md", "architecture.md", "roadmap.md", "index.md", version + "/requirements.md"}
    if set(op["files"]) != allowed:
        fail("关闭记录只能涉及本版需求及简介、架构、规划、索引")
    for rel, item in op["files"].items():
        path(root, rel)
        if digest(item["before"]) != item["before_sha256"] or digest(item["after"]) != item["after_sha256"]:
            fail("恢复记录内容指纹不符: " + rel)
    return op


def prepare(root, version, operation, proposal):
    checked_version(version)
    checked_id(operation)
    if not isinstance(proposal, dict):
        fail("关闭提案须为 JSON 对象")
    acceptance = proposal.get("acceptance", {})
    if not isinstance(acceptance, dict):
        fail("acceptance 须为 JSON 对象")
    if acceptance.get("confirmed") is not True or not acceptance.get("statement", "").strip() or not acceptance.get("source", "").strip():
        fail("关闭需要用户明确验收结论与来源")
    target = path(root, operation_rel(version, operation))
    for existing_version in states(root):
        if path(root, operation_rel(existing_version, operation)).exists():
            fail("操作标识须在项目中唯一；已存在: " + operation)
    if target.exists():
        fail("操作标识已存在；查看状态并续接或使用新标识，不覆盖")
    for candidate in path(root, version + "/.operations").glob("*/operation.json"):
        previous = load_operation(root, version, candidate.parent.name)
        if previous["status"] not in ("undone",):
            fail("本版本存在未撤销的关闭操作，请先续接或 undo: " + previous["id"])
    req_rel = version + "/requirements.md"
    req = read(root, req_rel)
    state = get_state(req)
    if state.get("closed_by"):
        fail("版本已关闭")
    issues = readiness(root, version, state)
    if issues:
        fail("尚不能关闭: " + "; ".join(issues))
    updates = proposal.get("updates", {})
    required = {req_rel, "project-brief.md", "architecture.md", "roadmap.md"}
    if set(updates) != required or not proposal.get("summary", "").strip():
        fail("提案须明确检查本版 requirements、project-brief、architecture、roadmap 四份全文，并提供同步摘要")
    stamp = now()
    files = {}
    for rel, update in updates.items():
        before = read(root, rel)
        if digest(before) != update.get("before_sha256"):
            fail("关闭提案依据过期: " + rel)
        after = update["after"]
        validate_doc(Path(rel).name, after)
        if rel == "roadmap.md":
            check_roadmap_change(before, after, proposal.get("roadmap_sources"))
        if rel == req_rel:
            if requirement_basis(after) != requirement_basis(before):
                fail("关闭不能同时改变需求范围；先完成需求变更与验证")
            closing_state = dict(state, phase="closed", closed_by=operation, closed_at=stamp)
            after = put_state(after, closing_state)
            after += f"\n- 用户验收：{acceptance['statement']}\n- 确认来源：{acceptance['source']}\n- 关闭依据：[操作记录](.operations/{operation}/operation.json)\n"
        files[rel] = {"before": before, "after": after, "before_sha256": digest(before), "after_sha256": digest(after)}
    before = read(root, "index.md")
    after = index_text(root, {version: closing_state})
    files["index.md"] = {"before": before, "after": after, "before_sha256": digest(before), "after_sha256": digest(after)}
    op = {"id": operation, "version": version, "created_at": stamp, "status": "prepared", "acceptance": acceptance,
          "roadmap_sources": proposal.get("roadmap_sources", {}),
          "summary": proposal["summary"], "files": files, "inputs": state, "applied": [], "restored": [], "resolutions": {}, "attempts": []}
    save_operation(root, op)
    return {"operation": operation, "status": "prepared", "path": operation_rel(version, operation)}


def operation_status(root, version, operation, full=False):
    op = load_operation(root, version, operation)
    if full:
        return op
    return {k: op.get(k) for k in ("id", "version", "status", "created_at", "applied", "restored", "conflicts", "attempts")}


def completed_close_logs(root, op):
    version, operation = op["version"], op["id"]
    summary = op["summary"]
    if "roadmap_sources" in op:
        summary += "\n- 规划用户来源：" + encode(op["roadmap_sources"])
    append_log(root, "update:" + operation, "project-update", summary, version, operation, timestamp=op["created_at"])
    body = "- 用户验收：" + encode(op["acceptance"]) + "\n- 同步：" + summary + "\n- 恢复入口：" + operation_rel(version, operation)
    append_log(root, "close:" + operation, "version-close", body, version, operation, timestamp=op["created_at"])


def apply_close(root, version, operation):
    op = load_operation(root, version, operation)
    if op["status"] not in ("prepared", "applying", "partial", "applied"):
        fail("此操作不在可关闭/续接状态")
    if op["status"] == "applied":
        completed_close_logs(root, op)
        return operation_status(root, version, operation)
    issues = readiness(root, version)
    current = get_state(read(root, version + "/requirements.md"))
    if any(current.get(k) != op["inputs"].get(k) for k in ("code", "test")):
        issues.append("验收后执行批次改变")
    if issues:
        fail("关闭依据已失效: " + "; ".join(issues))
    op["status"] = "applying"
    save_operation(root, op)
    conflicts = []
    order = ["project-brief.md", "architecture.md", "roadmap.md", version + "/requirements.md", "index.md"]
    for rel in order:
        item = op["files"][rel]
        actual = read(root, rel)
        if actual == item["after"]:
            pass
        elif actual == item["before"]:
            write(root, rel, item["after"], item["before_sha256"])
        else:
            conflicts.append(rel)
            break
        if rel not in op["applied"]:
            op["applied"].append(rel)
        save_operation(root, op)
    op["status"] = "partial" if conflicts else "applied"
    op["conflicts"] = conflicts
    attempt = "close-" + uuid.uuid4().hex
    op["attempts"].append({"id": attempt, "kind": "close", "time": now(), "result": op["status"]})
    save_operation(root, op)
    if conflicts:
        append_log(root, attempt, "version-close", "部分关闭；冲突：" + encode(conflicts) + "\n恢复入口：" + operation_rel(version, operation), version, operation, "partial")
    else:
        # Stable IDs repair missing logs after a crash without duplicating a
        # completed close. A new later close has a different operation id.
        completed_close_logs(root, op)
    return operation_status(root, version, operation)


def later_closures(root, op):
    later = []
    for version, state in states(root).items():
        other = state.get("closed_by")
        if other and other != op["id"]:
            record = load_operation(root, version, other)
            if record["created_at"] > op["created_at"]:
                later.append(record)
    return later


def undo_close(root, version, operation, reason):
    if not reason.strip():
        fail("undo 需记录原因")
    op = load_operation(root, version, operation)
    if op["status"] == "undone":
        if op.get("pending_undo_log"):
            append_log(root, **op["pending_undo_log"])
        return {"status": "undone", "already_undone": True, "operation": operation}
    req_rel = version + "/requirements.md"
    current_state = get_state(read(root, req_rel))
    if current_state.get("closed_by") not in (None, operation):
        fail("本版后来一次关闭仍生效，不能用旧 undo 撤销它")
    later = later_closures(root, op)
    op["status"] = "undoing"
    save_operation(root, op)
    conflicts = []
    for rel, item in op["files"].items():
        if rel == "index.md" or rel in op["restored"]:
            continue
        actual = read(root, rel)
        recovered = op.get("undo_targets", {}).get(rel)
        if recovered is not None and actual == recovered:
            op["restored"].append(rel)
            save_operation(root, op)
            continue
        resolution = op["resolutions"].get(rel)
        if resolution:
            if digest(actual) != resolution["current_sha256"] and actual != resolution["merged"]:
                conflicts.append(rel)
                continue
            desired = resolution["merged"]
        elif actual == item["before"] or item["before"] == item["after"]:
            desired = actual
        elif actual == item["after"] and not any(rel in newer["files"] for newer in later):
            desired = item["before"]
        else:
            conflicts.append(rel)
            continue
        if rel == req_rel:
            state = get_state(desired)
            state.update({"phase": "reopened", "closed_by": None})
            state.pop("closed_at", None)
            desired = put_state(desired, state)
            note = f"\n- 已撤销关闭 {operation}；原验收及关闭内容保存在[操作记录](.operations/{operation}/operation.json)，不代表回滚代码或测试。\n"
            if note.strip() not in desired:
                desired += note
        op.setdefault("undo_targets", {})[rel] = desired
        save_operation(root, op)
        if desired != actual:
            write(root, rel, desired, digest(actual))
        op["restored"].append(rel)
        save_operation(root, op)
    # Recompute only the generated navigation block, never restore an old
    # whole index snapshot that would erase other versions or manual notes.
    sync_index(root)
    op["conflicts"] = conflicts
    op["status"] = "undo-partial" if conflicts else "undone"
    attempt = "undo-" + uuid.uuid4().hex
    op["attempts"].append({"id": attempt, "kind": "undo", "time": now(), "result": op["status"]})
    body = "- 原操作：" + operation + "\n- 原因：" + reason + "\n- 已处理：" + encode(op["restored"]) + "\n- 冲突：" + encode(conflicts) + "\n- 依据：" + operation_rel(version, operation)
    op["pending_undo_log"] = {"event": attempt, "action": "undo", "body": body, "version": version, "parent": operation, "outcome": op["status"]}
    save_operation(root, op)
    append_log(root, **op["pending_undo_log"])
    return operation_status(root, version, operation)


def resolve_undo(root, version, operation, resolutions):
    op = load_operation(root, version, operation)
    if op["status"] != "undo-partial":
        fail("只有部分撤销的冲突可提交合并")
    for rel, resolution in resolutions.items():
        if rel not in op["conflicts"] or rel == "index.md":
            fail("不是本次待解决冲突: " + rel)
        if digest(read(root, rel)) != resolution["current_sha256"]:
            fail("合并依据已变化: " + rel)
        if not resolution.get("reason", "").strip():
            fail("必须说明合并保留后续工作及撤销范围的依据")
        validate_doc(Path(rel).name, resolution["merged"])
        op["resolutions"][rel] = resolution
    save_operation(root, op)
    return {"recorded_resolutions": list(resolutions), "next": "再次 close undo 应用合并并续接"}


def inventory(root, version=None, all_versions=False):
    if version:
        checked_version(version)
    if not safe(root, "pjkp").exists():
        return {"project": str(root), "initialized": False, "files": []}
    candidates = list(PROJECT_DOCS) + ["config.toml"]
    for folder in sorted(safe(root, "pjkp").iterdir()):
        if VERSION.fullmatch(folder.name) and (all_versions or folder.name == version):
            candidates.extend(folder.name + "/" + name for name in VERSION_DOCS)
    files = []
    for rel in candidates:
        target = path(root, rel)
        if target.is_file():
            text = target.read_text(encoding="utf-8")
            outline = headings(text, 1) if rel == "log.md" else headings(text)
            files.append({"path": "pjkp/" + rel, "bytes": len(text.encode("utf-8")), "sha256": digest(text), "headings": outline})
    return {"project": str(root), "initialized": True, "files": files,
            "versions": {v: {"phase": s["phase"], "closed_by": s.get("closed_by"),
                             **({"readiness_issues": readiness(root, v, s)} if all_versions or v == version else {})}
                         for v, s in states(root).items()},
            "note": "默认不展开历史版本和日志标题；--version 选择版本，--all-versions 显式查看全部版本导航；read 按章节/日志 id 取原文"}


def validate(root, version=None, stage="requirements"):
    root = Path(root).resolve()
    errors, warnings = [], []
    targets = list(PROJECT_DOCS)
    if version:
        checked_version(version)
        needed = {"requirements": 1, "plan": 3, "test": 4, "close": 4}[stage]
        targets += [version + "/" + name for name in VERSION_DOCS[:needed]]
    for rel in targets:
        try:
            validate_doc(Path(rel).name, read(root, rel))
        except (OSError, ValueError) as exc:
            errors.append(rel + ": " + str(exc))
    try:
        if any(h["title"] == "短期待办" for h in headings(read(root, "roadmap.md"), 2)):
            warnings.append("roadmap 仍使用旧标题短期待办；下次用户授权维护时可统一为 todo，当前不改写正文")
        config = read(root, "config.toml")
        if any(line.strip() and not line.lstrip().startswith("#") for line in config.splitlines()):
            warnings.append("config.toml 字段尚未定义，内容不会被读取")
        for rel in targets:
            for link in re.findall(r"\]\(([^)]+)\)", read(root, rel)):
                if "://" in link or link.startswith("#"):
                    continue
                filename = link.split("#", 1)[0]
                # Links may use .. for legitimate project-root source navigation;
                # resolve within project, then inspect each normalized component.
                target = (path(root, rel).parent / filename).absolute()
                normalized = Path(os.path.normpath(target))
                try:
                    relative = normalized.relative_to(root).as_posix()
                    checked = safe(root, relative)
                    if not checked.exists():
                        errors.append(rel + " 链接不存在: " + link)
                except (ValueError, KeeperError):
                    errors.append(rel + " 链接越界: " + link)
        if version:
            warnings.extend(readiness(root, version))
            if stage == "close":
                errors.extend(readiness(root, version))
    except (OSError, ValueError) as exc:
        errors.append(str(exc))
    return {"valid": not errors, "errors": errors, "warnings": warnings, "note": "结构检查不证明内容正确、代码完成、测试通过或用户已验收"}


def json_input(filename):
    return json.loads(Path(filename).read_text(encoding="utf-8"))


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--project", help="项目根目录，不是 pjkp 目录")
    sub = p.add_subparsers(dest="command", required=True)
    q = sub.add_parser("context", help="只读导航，不输出全文")
    selection = q.add_mutually_exclusive_group()
    selection.add_argument("--version")
    selection.add_argument("--all-versions", action="store_true")
    q = sub.add_parser("read", help="精确读取一个项目文档章节或日志行为")
    q.add_argument("file", help="相对于 pjkp")
    q.add_argument("--section")
    q.add_argument("--event")
    q = sub.add_parser("init")
    q.add_argument("--name", required=True)
    q = sub.add_parser("version-create")
    q.add_argument("version")
    q.add_argument("--name", required=True)
    q = sub.add_parser("scaffold")
    q.add_argument("version")
    q.add_argument("file", choices=VERSION_DOCS[1:])
    q.add_argument("--name", required=True)
    sub.add_parser("sync-index")
    q = sub.add_parser("roadmap-update")
    q.add_argument("--id", required=True)
    q.add_argument("--proposal", required=True)
    q = sub.add_parser("validate")
    q.add_argument("--version")
    q.add_argument("--stage", choices=("requirements", "plan", "test", "close"), default="requirements")
    q = sub.add_parser("log")
    q.add_argument("--id", required=True)
    q.add_argument("--action", required=True)
    q.add_argument("--body-file", required=True)
    q.add_argument("--version")
    q.add_argument("--parent")
    q.add_argument("--outcome", default="completed")
    q = sub.add_parser("record")
    q.add_argument("kind", choices=("code", "test"))
    q.add_argument("version")
    q.add_argument("--id", required=True)
    q.add_argument("--body-file", required=True)
    q.add_argument("--implementation", action="append", default=[])
    q.add_argument("--parent")
    q = sub.add_parser("close")
    q.add_argument("mode", choices=("prepare", "apply", "status", "undo", "resolve"))
    q.add_argument("version")
    q.add_argument("operation")
    q.add_argument("--proposal")
    q.add_argument("--resolutions")
    q.add_argument("--reason")
    q.add_argument("--full", action="store_true")
    return p


def dispatch(args, root):
    if args.command == "context":
        return inventory(root, args.version, args.all_versions)
    if args.command == "read":
        text = read(root, args.file)
        if args.section and args.event:
            fail("section 和 event 只能选一项")
        if args.event:
            matches = [body for meta, body in log_entries(text) if meta["id"] == args.event]
            if len(matches) != 1:
                fail("日志 id 不存在或重复")
            return {"path": args.file, "text": matches[0]}
        return {"path": args.file, "sha256": digest(text), "text": section(text, args.section) if args.section else text}
    if args.command == "init":
        return init(root, args.name)
    if args.command == "version-create":
        return create_version(root, args.version, args.name)
    if args.command == "scaffold":
        return scaffold(root, args.version, args.name, args.file)
    if args.command == "sync-index":
        return sync_index(root)
    if args.command == "roadmap-update":
        return update_roadmap(root, args.id, json_input(args.proposal))
    if args.command == "validate":
        return validate(root, args.version, args.stage)
    if args.command == "log":
        return append_log(root, args.id, args.action, Path(args.body_file).read_text(encoding="utf-8"), args.version, args.parent, args.outcome)
    if args.command == "record":
        return record(root, args.version, args.kind, args.id, Path(args.body_file).read_text(encoding="utf-8"), args.implementation, args.parent)
    if args.command == "close":
        if args.mode == "prepare":
            if not args.proposal:
                fail("prepare 需要 --proposal JSON 文件")
            return prepare(root, args.version, args.operation, json_input(args.proposal))
        if args.mode == "apply":
            return apply_close(root, args.version, args.operation)
        if args.mode == "status":
            return operation_status(root, args.version, args.operation, args.full)
        if args.mode == "undo":
            if not args.reason:
                fail("undo 需要 --reason")
            return undo_close(root, args.version, args.operation, args.reason)
        if not args.resolutions:
            fail("resolve 需要 --resolutions JSON 文件")
        return resolve_undo(root, args.version, args.operation, json_input(args.resolutions))
    fail("未知命令")


def main(argv=None):
    args = parser().parse_args(argv)
    try:
        root = root_path(args.project)
        readonly = args.command in ("context", "read", "validate") or (args.command == "close" and args.mode == "status")
        if readonly:
            result = dispatch(args, root)
        else:
            if args.command != "init" and not safe(root, "pjkp").is_dir():
                fail("项目未初始化；只有 init 可建立 pjkp")
            with lock(root):
                result = dispatch(args, root)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result.get("valid", True) and result.get("status") not in ("partial", "undo-partial") else 1
    except (KeeperError, OSError, ValueError, KeyError, TypeError) as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
