import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 320);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      size="icon"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      data-testid="button-scroll-to-top"
      className={`fixed right-5 md:right-7 z-40 rounded-full shadow-xl transition-all duration-300 ${
        isVisible
          ? "bottom-24 opacity-100 translate-y-0"
          : "bottom-20 opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp className="w-4 h-4" />
    </Button>
  );
}
