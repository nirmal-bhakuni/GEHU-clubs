import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Shield, CheckCircle, XCircle, Sparkles } from "lucide-react";

type CaptchaOperation = '+' | '-' | '×';

interface CaptchaData {
  num1: number;
  num2: number;
  operation: CaptchaOperation;
  answer: number;
}

interface CaptchaComponentProps {
  onVerify: (verified: boolean) => void;
  className?: string;
}

export default function CaptchaComponent({ onVerify, className = "" }: CaptchaComponentProps) {
  const [captcha, setCaptcha] = useState<CaptchaData>({ num1: 0, num2: 0, operation: '+', answer: 0 });
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { toast } = useToast();

  // Generate random captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const operations: CaptchaOperation[] = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1: number, num2: number, answer: number;

    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 15) + 1; // 1-15
        num2 = Math.floor(Math.random() * 15) + 1; // 1-15
        answer = num1 + num2;
        break;
      case '-':
        num1 = Math.floor(Math.random() * 15) + 10; // 10-25
        num2 = Math.floor(Math.random() * num1) + 1; // 1 to num1
        answer = num1 - num2;
        break;
      case '×':
        num1 = Math.floor(Math.random() * 8) + 2; // 2-9
        num2 = Math.floor(Math.random() * 8) + 2; // 2-9
        answer = num1 * num2;
        break;
      default:
        num1 = 1;
        num2 = 1;
        answer = 2;
    }

    setCaptcha({ num1, num2, operation, answer });
    setCaptchaInput("");
    setCaptchaVerified(false);
    onVerify(false);
  };

  const verifyCaptcha = () => {
    const userAnswer = parseInt(captchaInput);
    if (userAnswer === captcha.answer) {
      setCaptchaVerified(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      toast({
        title: "Captcha verified! 🎉",
        description: "You're not a robot!",
      });
      onVerify(true);
    } else {
      setCaptchaVerified(false);
      toast({
        title: "Incorrect answer",
        description: "Try again or generate a new problem",
        variant: "destructive",
      });
      setCaptchaInput("");
      onVerify(false);
    }
  };

  const handleCaptchaInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptchaInput(e.target.value);
    // Auto-verify when user types the correct answer
    if (parseInt(e.target.value) === captcha.answer && e.target.value !== "") {
      setCaptchaVerified(true);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      onVerify(true);
    } else {
      setCaptchaVerified(false);
      onVerify(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label className="flex items-center gap-2 text-base font-semibold">
        <Shield className="h-5 w-5 text-primary" />
        Human Verification
        {captchaVerified && <CheckCircle className="h-5 w-5 text-green-500 animate-pulse" />}
      </Label>

      <div className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
        captchaVerified
          ? 'bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700 shadow-lg shadow-green-100 dark:shadow-green-900/20'
          : 'bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 dark:border-primary/30'
      }`}>
        {/* Celebration Effect */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex gap-2">
              <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: '200ms' }} />
              <Sparkles className="h-6 w-6 text-yellow-400 animate-bounce" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}

        {/* Captcha Problem Display */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-2xl font-bold font-mono text-center flex-1 py-3 px-4 rounded-lg bg-card shadow-sm border-2 transition-all ${
            captchaVerified ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400' : 'border-border'
          }`}>
            <span className="text-primary">{captcha.num1}</span>
            <span className="text-orange-500 dark:text-orange-400 mx-2">{captcha.operation}</span>
            <span className="text-primary">{captcha.num2}</span>
            <span className="text-muted-foreground ml-2">=</span>
            <span className="text-muted-foreground">?</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateCaptcha}
            className="ml-3 shrink-0 hover:bg-primary/5 dark:hover:bg-primary/10"
            title="New problem"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Answer Input */}
        <div className="flex gap-2">
          <Input
            type="number"
            value={captchaInput}
            onChange={handleCaptchaInput}
            placeholder="Your answer"
            className={`text-center font-mono text-lg transition-all ${
              captchaVerified
                ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                : 'border-primary/30 focus:border-primary'
            }`}
            disabled={captchaVerified}
          />
          {!captchaVerified && (
            <Button
              type="button"
              onClick={verifyCaptcha}
              disabled={!captchaInput}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
            >
              Verify
            </Button>
          )}
        </div>

        {/* Status Message */}
        <div className="mt-3 text-center">
          {captchaVerified ? (
            <p className="text-green-600 dark:text-green-400 font-medium flex items-center justify-center gap-1">
              <CheckCircle className="h-4 w-4" />
              Verified! You're human! 🎉
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Solve the math problem to prove you're not a robot
            </p>
          )}
        </div>
      </div>
    </div>
  );
}