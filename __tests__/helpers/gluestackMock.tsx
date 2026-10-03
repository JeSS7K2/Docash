import React from 'react';
import { Pressable, Text, View } from 'react-native';

// Mapeo mínimo 1:1 para tests. Actionsheet respeta isOpen como el real.
export const Box = View;
export { Pressable, Text };
export const Heading = Text;
export const Actionsheet = ({
  isOpen,
  children,
}: {
  isOpen?: boolean;
  children?: React.ReactNode;
}) => (isOpen ? <View>{children}</View> : null);
export const ActionsheetBackdrop = View;
export const ActionsheetContent = View;
export const ActionsheetDragIndicator = View;
export const ActionsheetDragIndicatorWrapper = View;
export const ActionsheetScrollView = View;
export const Divider = View;
export const Modal = ({
  isOpen,
  children,
}: {
  isOpen?: boolean;
  children?: React.ReactNode;
}) => (isOpen ? <View>{children}</View> : null);
export const ModalBackdrop = View;
export const ModalContent = View;
export const ModalHeader = View;
export const ModalBody = View;
export const ModalFooter = View;
