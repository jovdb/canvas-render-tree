import { PropsWithChildren } from "react";
import "./AppOverlay.css";

export const AppOverlay = ({ children }: PropsWithChildren<object>) => {
  return <div className="app__overlay">{children}</div>;
};
