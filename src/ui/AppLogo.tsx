import React from 'react';
import { SvgXml } from 'react-native-svg';
import { APP_LOGO_SVG } from '../assets/logo';

interface AppLogoProps {
  size?: number;
  testID?: string;
}

export default function AppLogo({ size = 32, testID = 'app-logo' }: AppLogoProps) {
  return <SvgXml xml={APP_LOGO_SVG} width={size} height={size} testID={testID} />;
}
