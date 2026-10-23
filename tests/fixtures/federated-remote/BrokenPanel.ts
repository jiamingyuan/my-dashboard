export default function BrokenPanel(): never {
  throw new Error('Intentional remote rendering failure for the error boundary test.')
}
