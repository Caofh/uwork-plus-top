import * as vscode from "vscode";

const DEFAULT_REMOTE_ORIGIN = "";

export function getRemoteOrigin(): string {
  const config = vscode.workspace.getConfiguration("uworkplus");
  return (config.get<string>("remoteOrigin") || DEFAULT_REMOTE_ORIGIN).trim();
}

export function remoteUrl(path: string): string {
  const origin = getRemoteOrigin();
  if (!origin) return "";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin.replace(/\/+$/, "")}${normalizedPath}`;
}

export function getLowcodeEditorUrl(): string {
  const config = vscode.workspace.getConfiguration("uworkplus");
  const configured = (config.get<string>("lowcodeEditorUrl") || "").trim();
  if (configured) return configured;
  return remoteUrl("/lowcodeEditor/") || "";
}

export function getIntroductionUrl(): string {
  return remoteUrl("/uworkplus/introduction?origin=custom") || "";
}
