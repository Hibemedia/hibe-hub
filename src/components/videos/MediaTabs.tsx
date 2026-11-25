import { useNavigate } from "react-router-dom";
import { SegmentedControl } from "@/components/ui/segmented-control";

export function MediaTabs({ value }: { value: "overview" | "board" }) {
  const navigate = useNavigate();
  return <SegmentedControl label="Mediaweergave" value={value} options={[{ value: "overview", label: "Overzicht" }, { value: "board", label: "Board" }]} onChange={(tab) => navigate(tab === "board" ? "/hibe/pipeline" : "/hibe/videos")} />;
}