import { sketchJudgeAssets } from "./assets";

type Props = {
  className?: string;
};

export function Crown({ className = "" }: Props) {
  const classes = className ? `svg-crown ${className}` : "svg-crown";
  return (
    <img
      src={sketchJudgeAssets.crown}
      className={classes}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
