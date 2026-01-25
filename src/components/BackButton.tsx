import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type BackButtonProps = {
  label?: string;
  className?: string;
};

const BackButton = ({ label = "Back", className }: BackButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      className={`inline-flex items-center gap-2 rounded-full ${className ?? ""}`}
      onClick={() => navigate(-1)}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default BackButton;
