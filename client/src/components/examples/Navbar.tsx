import Navbar from '../Navbar'
import { ThemeProvider } from '../ThemeProvider'

export default function NavbarExample() {
  return (
    <ThemeProvider>
      <Navbar onToggleSidebar={() => {}} />
    </ThemeProvider>
  )
}
