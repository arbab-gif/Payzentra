import { Modal, type ModalProps } from "react-native";
import { usePreview } from "@/lib/preview";
import { PreviewPortal } from "./PreviewPortal";

/** A Modal, except in the screen gallery, where it renders inside the screen's own frame. */
export function Overlay(props: ModalProps) {
  const preview = usePreview();
  if (!preview) return <Modal {...props} />;
  if (!props.visible) return null;
  return <PreviewPortal>{props.children}</PreviewPortal>;
}
