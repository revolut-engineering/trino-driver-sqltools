import * as vscode from "vscode";
import {
  IExtension,
  IExtensionPlugin,
  IDriverExtensionApi,
} from "@sqltools/types";

import { ExtensionContext } from "vscode";
import { DRIVER_ALIASES } from "./constants";
import { publisher, name, displayName } from "../package.json";

export async function activate(
  extContext: ExtensionContext
): Promise<IDriverExtensionApi> {
  const sqltools = vscode.extensions.getExtension<IExtension>("mtxr.sqltools");

  if (!sqltools) {
    throw new Error("SQLTools not installed");
  }
  await sqltools.activate();

  const api = sqltools.exports;

  const extensionId = `${publisher}.${name}`;
  const plugin: IExtensionPlugin = {
    extensionId,
    name: `${displayName} Plugin`,
    type: "driver",
    async register(extension) {
      // register ext part here
      extension.resourcesMap().set(`driver/${DRIVER_ALIASES[0].value}/icons`, {
        active: extContext.asAbsolutePath("icons/active.png"),
        default: extContext.asAbsolutePath("icons/default.png"),
        inactive: extContext.asAbsolutePath("icons/inactive.png"),
      });

      DRIVER_ALIASES.forEach(({ value }) => {
        extension
          .resourcesMap()
          .set(`driver/${value}/extension-id`, extensionId);
        extension
          .resourcesMap()
          .set(
            `driver/${value}/connection-schema`,
            extContext.asAbsolutePath("connection.schema.json")
          );
        extension
          .resourcesMap()
          .set(
            `driver/${value}/ui-schema`,
            extContext.asAbsolutePath("ui.schema.json")
          );
      });

      await extension.client.sendRequest("ls/RegisterPlugin", {
        path: extContext.asAbsolutePath("out/ls/plugin.js"),
      });
    },
  };

  api.registerPlugin(plugin);

  return {
    driverName: displayName,
    parseBeforeSaveConnection: ({ connInfo }) => {
      return connInfo;
    },
    parseBeforeEditConnection: ({ connInfo }) => {
      return connInfo;
    },
    driverAliases: DRIVER_ALIASES,
  };

}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate() {}
