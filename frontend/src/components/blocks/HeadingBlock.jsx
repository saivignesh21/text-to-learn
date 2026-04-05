
import React from "react";
import "./HeadingBlock.css";

const HeadingBlock = ({ text = "", level = 1 }) => {
  if (!text) {
    console.warn("HeadingBlock: No text provided");
    return null;
  }

  const HeadingTag = `h${Math.max(1, Math.min(6, level))}`;

  return (
    <HeadingTag className={`heading-block level-${level}`}>
      {text}
    </HeadingTag>
  );
};

export default HeadingBlock;