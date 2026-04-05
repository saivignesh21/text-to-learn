import React from "react";
import "./ParagraphBlock.css";

const ParagraphBlock = ({ text }) => {
  // Handle basic markdown-like formatting
  const formatText = (str) => {
    if (!str) return "";
    
    return str
      .split("\n")
      .map((line, idx) => (
        <React.Fragment key={idx}>
          {line}
          {idx < str.split("\n").length - 1 && <br />}
        </React.Fragment>
      ));
  };

  return (
    <p className="paragraph-block">
      {formatText(text)}
    </p>
  );
};

export default ParagraphBlock;

