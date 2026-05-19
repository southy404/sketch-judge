import { sketchJudgeAssets } from "./assets";

type Props = {
  className?: string;
};

export function SvgUnderline({ className = "" }: Props) {
  const classes = className ? `svg-underline ${className}` : "svg-underline";
  return (
    <img
      src={sketchJudgeAssets.underline}
      className={classes}
      alt=""
      aria-hidden="true"
      draggable={false}
    />
  );
}
