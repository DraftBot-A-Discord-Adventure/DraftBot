import { ScrollViewStyleReset } from "expo-router/html";
import {
	type PropsWithChildren, ReactNode
} from "react";

/**
 * The page the web build is served in, Discord Activity included. Its scroll bars are thin, as in Discord:
 * a wide one shifts each scrolling column off the centre of the header above it.
 */
const SCROLLBAR_STYLE = `
* { scrollbar-width: thin; scrollbar-color: rgba(128, 128, 128, 0.45) transparent; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.45); border-radius: 3px; }
`;

export default function Root({ children }: PropsWithChildren): ReactNode {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta httpEquiv="X-UA-Compatible" content="IE=edge" />
				<meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
				<ScrollViewStyleReset />
				<style dangerouslySetInnerHTML={{ __html: SCROLLBAR_STYLE }} />
			</head>
			<body>{children}</body>
		</html>
	);
}
