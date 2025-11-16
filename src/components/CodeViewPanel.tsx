import { Highlight, themes, Token } from "prism-react-renderer";
import { useEffect, useRef } from "react";

import { Component } from "../module/Component";

export interface CodeViewerSource {
  component: Component;
  type: "jsx" | "tsx";
  source: string;
}

export default function CodeViewPanel({
  codeViewerSource,
  clickedNode,
}: {
  codeViewerSource: CodeViewerSource;
  clickedNode: string;
}) {
  const clickedNodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clickedNodeRef.current) {
      clickedNodeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "start",
      });
    }
  }, [clickedNode]);

  const component = codeViewerSource.component;
  const getClickedRef = (i: number) => {
    const lineIndex = i + 1;
    const isComponentStart = component.definingPosition.start === lineIndex;
    const associatedState = component.states.find(
      (state) => state.definingPosition.start === lineIndex
    );
    const associatedEffect = component.effects.find(
      (effect) => effect.definingPosition.start === lineIndex
    );
    const associatedProp = component.props.find(
      (prop) => prop.definingPosition.line === lineIndex
    );

    if (
      (isComponentStart && clickedNode === component.id) ||
      clickedNode === associatedState?.id ||
      clickedNode === associatedEffect?.id ||
      clickedNode === associatedProp?.id
    ) {
      return clickedNodeRef;
    }

    return null;
  };

  const getLineBackgroundClassName = (i: number) => {
    const lineIndex = i + 1;
    return component.definingPosition.start <= lineIndex &&
      component.definingPosition.end >= lineIndex
      ? "text-gray-400 font-bold "
      : "text-gray-500 ";
  };

  const getTokenStyleClassName = (
    line: number,
    column: number,
    tokens: Token[]
  ) => {
    const getTokenIndexAtColumn = (
      tokens: Token[],
      targetColumn: number
    ): number => {
      let currentColumn = 0;

      for (let i = 0; i < tokens.length; i++) {
        const tokenLength = tokens[i].content.length;
        const nextColumn = currentColumn + tokenLength;

        if (targetColumn >= currentColumn && targetColumn < nextColumn) {
          return i;
        }

        currentColumn = nextColumn;
      }

      return -1;
    };

    const lineIndex = line + 1;
    const associatedProp = component.props.find(
      (prop) =>
        prop.definingPosition.line === lineIndex &&
        getTokenIndexAtColumn(tokens, prop.definingPosition.column) === column
    );

    const clickedProp = component.props.find((prop) => prop.id === clickedNode);
    const isPropAccessed = clickedProp?.accessingPositions.some(
      (pos) =>
        pos.line === lineIndex &&
        getTokenIndexAtColumn(tokens, pos.column) === column
    );

    const clickedState = component.states.find(
      (state) => state.id === clickedNode
    );
    const isStateAccessed =
      clickedState?.accessingPositions.some(
        (pos) =>
          pos.line === lineIndex &&
          getTokenIndexAtColumn(tokens, pos.column) === column
      ) ||
      clickedState?.accessingSetterPositions.some(
        (pos) =>
          pos.line === lineIndex &&
          getTokenIndexAtColumn(tokens, pos.column) === column
      );

    if (associatedProp) {
      return clickedNode === associatedProp.id
        ? "ring-3 ring-[#f0f0f0]/20 rounded-lg bg-[#eb9049]/30 "
        : "rounded-lg bg-[#eb9049]/20 ";
    } else if (isPropAccessed) {
      return "ring-3 ring-[#f0f0f0]/20 rounded-lg bg-[#eb9049]/30 ";
    } else if (isStateAccessed) {
      return "ring-3 ring-[#f0f0f0]/20 rounded-lg bg-[#b7de90]/30 ";
    }

    return "";
  };

  const getBackgroundClassName = (i: number) => {
    const lineIndex = i + 1;
    const isInComponent =
      component.definingPosition.start <= lineIndex &&
      component.definingPosition.end >= lineIndex;
    const associatedState = component.states.find(
      (state) =>
        state.definingPosition.start <= lineIndex &&
        state.definingPosition.end >= lineIndex
    );
    const associatedEffect = component.effects.find(
      (effect) =>
        effect.definingPosition.start <= lineIndex &&
        effect.definingPosition.end >= lineIndex
    );

    if (associatedState) {
      return clickedNode === associatedState.id
        ? "border-x-3 border-[#f0f0f0]/10 bg-[#b7de90]/30 "
        : "border-x-3 border-[#f0f0f0]/10 bg-[#b7de90]/20 ";
    } else if (associatedEffect) {
      return clickedNode === associatedEffect.id
        ? "border-x-3 border-[#f0f0f0]/10 bg-[#85b8e2]/30 "
        : "border-x-3 border-[#f0f0f0]/10 bg-[#85b8e2]/20 ";
    } else if (isInComponent) {
      return clickedNode === component.id
        ? "border-x-3 border-[#f0f0f0]/10 bg-white/13 "
        : "bg-white/8 ";
    }

    return "bg-transparent ";
  };

  const getStartLineClassName = (i: number) => {
    const lineIndex = i + 1;
    const isComponentStart = component.definingPosition.start === lineIndex;
    const relatedState = component.states.find(
      (state) => state.definingPosition.start === lineIndex
    );
    const relatedEffect = component.effects.find(
      (effect) => effect.definingPosition.start === lineIndex
    );

    if (isComponentStart) {
      return clickedNode === component.id
        ? "font-bold border-t-[#f0f0f0]/8 border-t-3 rounded-t-lg "
        : "rounded-t-lg ";
    } else if (
      clickedNode === relatedState?.id ||
      clickedNode === relatedEffect?.id
    ) {
      return "border-t-[#f0f0f0]/8 border-t-3 rounded-t-lg ";
    }

    return "";
  };

  const getEndLineClassName = (i: number) => {
    const lineIndex = i + 1;
    const isComponentEnd = component.definingPosition.end === lineIndex;
    const relatedState = component.states.find(
      (state) => state.definingPosition.end === lineIndex
    );
    const relatedEffect = component.effects.find(
      (effect) => effect.definingPosition.end === lineIndex
    );

    if (isComponentEnd) {
      return clickedNode === component.id
        ? "border-b-[#f0f0f0]/8 border-b-3 rounded-b-lg "
        : "rounded-b-lg ";
    } else if (
      clickedNode === relatedState?.id ||
      clickedNode === relatedEffect?.id
    ) {
      return "border-b-[#f0f0f0]/8 border-b-3 rounded-b-lg ";
    }

    return "";
  };

  return (
    <Highlight
      theme={themes.vsDark}
      code={codeViewerSource.source}
      language={codeViewerSource.type}
    >
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre
          className={className}
          style={{
            ...style,
            padding: "4px",
            overflow: "auto",
            width: "fit-content",
          }}
        >
          {tokens.map((line, i) => {
            return (
              <div
                {...getLineProps({ line, key: i })}
                key={`token_${i}`}
                className={
                  "flex items-start w-full min-w-[775px] text-sm " +
                  getBackgroundClassName(i) +
                  getStartLineClassName(i) +
                  getEndLineClassName(i)
                }
                ref={getClickedRef(i)}
              >
                <span
                  className={
                    "shrink-0 pr-[12px] w-12 text-right select-none " +
                    getLineBackgroundClassName(i)
                  }
                >
                  {i + 1}
                </span>
                {line.map((token, key) => (
                  <span
                    {...getTokenProps({ token, key })}
                    key={`line_${token.content}_${i}_${key}`}
                    className={getTokenStyleClassName(i, key, line)}
                  />
                ))}
              </div>
            );
          })}
        </pre>
      )}
    </Highlight>
  );
}
