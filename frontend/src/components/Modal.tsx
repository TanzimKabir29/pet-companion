import { Component, ParentComponent, Show } from "solid-js";
import { Portal } from "solid-js/web";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClass = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

const Modal: ParentComponent<ModalProps> = (props) => {
  return (
    <Show when={props.open}>
      <Portal>
        <div
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) props.onClose();
          }}
        >
          {/* Backdrop */}
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            class={`relative bg-white rounded-2xl shadow-xl w-full ${
              sizeClass[props.size ?? "md"]
            } max-h-[90vh] flex flex-col`}
          >
            {/* Header */}
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">{props.title}</h2>
              <button
                onClick={props.onClose}
                class="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div class="overflow-y-auto flex-1 px-6 py-4">
              {props.children}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};

export default Modal;
