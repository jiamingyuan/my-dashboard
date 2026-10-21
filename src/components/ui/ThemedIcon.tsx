import { useTheme } from '../../theme/useTheme'
import morningBrand from '../../assets/icons/morning/brand.svg'
import morningHome from '../../assets/icons/morning/home.svg'
import nightBrand from '../../assets/icons/night/brand.svg'
import nightHome from '../../assets/icons/night/home.svg'
import styles from './ThemedIcon.module.css'

const assets = {
  morning: { brand: morningBrand, home: morningHome },
  night: { brand: nightBrand, home: nightHome },
}

export function ThemedIcon({ name }: { name: 'brand' | 'home' }) {
  const { theme } = useTheme()
  return (
    <span className={`${styles.icon} ${styles[`${name}_${theme}`]}`} aria-hidden="true">
      <img src={assets[theme][name]} alt="" draggable={false} />
    </span>
  )
}
