import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, RefreshCw } from "lucide-react"
import { useLocation } from "wouter"
import { signupUser } from "@/lib/userManager"

export default function SignupModal() {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [studentId, setStudentId] = React.useState("")
  const [major, setMajor] = React.useState("Computer Science")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [answer, setAnswer] = React.useState("")
  const [a, setA] = React.useState(() => Math.floor(Math.random() * 9) + 1)
  const [b, setB] = React.useState(() => Math.floor(Math.random() * 9) + 1)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()
  const [, navigate] = useLocation()

  const expected = a + b

  function regen() {
    setA(Math.floor(Math.random() * 9) + 1)
    setB(Math.floor(Math.random() * 9) + 1)
    setAnswer("")
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!name.trim()) {
      setError("Please enter your name")
      return
    }
    if (!email.trim()) {
      setError("Please enter your email")
      return
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email")
      return
    }
    if (!studentId.trim()) {
      setError("Please enter your student ID")
      return
    }
    if (!password) {
      setError("Please enter a password")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (Number(answer) !== expected) {
      setError("Captcha answer is incorrect")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      // Attempt signup
      const result = signupUser(name, email, studentId, password, major)

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Welcome to GEHU Clubs. Please login to continue.",
        })
        setOpen(false)
        // Reset form
        setName("")
        setEmail("")
        setStudentId("")
        setPassword("")
        setConfirmPassword("")
        setAnswer("")
        regen()
        setIsLoading(false)
      } else {
        setError(result.message)
        setIsLoading(false)
      }
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Sign Up</span>
          <span className="sm:hidden">Register</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Create Account
          </DialogTitle>
          <DialogDescription>
            Join GEHU Clubs community. Fill in your details to create an account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              disabled={isLoading}
              className="transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@gehu.ac.in"
              disabled={isLoading}
              className="transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="studentId" className="text-sm font-medium text-foreground">
              Student ID
            </label>
            <Input
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="e.g. 2025CS1001"
              disabled={isLoading}
              className="transition-all"
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="major" className="text-sm font-medium text-foreground">
              Major/Department
            </label>
            <Input
              id="major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g. Computer Science"
              disabled={isLoading}
              className="transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="transition-all"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              className="transition-all"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Verify Captcha</label>
            <div className="flex items-center gap-2">
              <div className="px-4 py-3 rounded-lg border-2 border-border bg-muted/50 font-bold text-lg min-w-max">
                {a} + {b} = ?
              </div>
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer"
                disabled={isLoading}
                className="flex-1 transition-all"
                type="number"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={regen}
                disabled={isLoading}
                className="gap-1"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          <DialogFooter className="mt-6">
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setName("")
                  setEmail("")
                  setStudentId("")
                  setPassword("")
                  setConfirmPassword("")
                  setAnswer("")
                  regen()
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Creating..." : "Sign Up"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
