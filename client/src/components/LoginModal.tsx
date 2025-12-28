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
import { LogIn, RefreshCw } from "lucide-react"
import { useLocation } from "wouter"
import { loginUser } from "@/lib/userManager"

export default function LoginModal() {
  const [open, setOpen] = React.useState(false)
  const [studentId, setStudentId] = React.useState("")
  const [password, setPassword] = React.useState("")
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
    if (!studentId.trim()) {
      setError("Please enter your student ID")
      return
    }
    if (!password) {
      setError("Please enter your password")
      return
    }
    if (Number(answer) !== expected) {
      setError("Captcha answer is incorrect")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      // Attempt login
      const result = loginUser(studentId, password)

      if (result.success) {
        toast({ title: "Login successful", description: "Welcome back!" })
        setOpen(false)
        setStudentId("")
        setPassword("")
        setAnswer("")
        setIsLoading(false)
        regen()
        navigate("/student")
      } else {
        setError(result.message)
        setIsLoading(false)
      }
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Student Login</span>
          <span className="sm:hidden">Login</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="w-5 h-5 text-primary" />
            Student Login
          </DialogTitle>
          <DialogDescription>
            Sign in with your Student ID and password. Complete the captcha to
            continue.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              autoComplete="current-password"
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
                  setStudentId("")
                  setPassword("")
                  setAnswer("")
                  regen()
                }}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
