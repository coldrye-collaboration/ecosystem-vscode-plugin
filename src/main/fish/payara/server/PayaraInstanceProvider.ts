'use strict';

/*
 * Copyright (c) 2020 Payara Foundation and/or its affiliates and others.
 * All rights reserved.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0, which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the
 * Eclipse Public License v. 2.0 are satisfied: GNU General Public License,
 * version 2 with the GNU Classpath Exception, which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 */

import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";
import * as _ from "lodash";
import * as fse from "fs-extra";
import { PayaraServerInstance } from "./PayaraServerInstance";

export class PayaraInstanceProvider {

    private servers: PayaraServerInstance[] = [];
    private serversConfig: string;

    constructor(public context: vscode.ExtensionContext) {
        this.serversConfig = this.getserversConfig(context);
    }

    getServers(): PayaraServerInstance[] {
        return this.servers;
    }

    public getServerByName(name: string): PayaraServerInstance | undefined {
        return this.servers.find(
            item => item.getName() === name
        );
    }

    getserversConfig(context: vscode.ExtensionContext): string {
        let storagePath: string;
        if (!context.storagePath) {
            storagePath = path.resolve(os.tmpdir(), `payara_vscode`);
        } else {
            storagePath = context.storagePath;
        }
        return path.join(storagePath, 'servers.json');
    }

    public addServer(payaraServer: PayaraServerInstance): void {
        this.removeServerFromList(payaraServer);
        this.servers.push(payaraServer);
        this.updateServerConfig();
    }

    public removeServer(payaraServer: PayaraServerInstance): boolean {
        if (this.removeServerFromList(payaraServer)) {
            this.updateServerConfig();
            return true;
        }
        return false;
    }

    private removeServerFromList(payaraServer: PayaraServerInstance): boolean {
        const index: number = this.servers.findIndex(
            server => server.getName() === payaraServer.getName()
        );
        if (index > -1) {
            this.servers.splice(index, 1);
            return true;
        }
        return false;
    }

    public async updateServerConfig(): Promise<void> {
        try {
            await fse.outputJson(
                this.serversConfig,
                this.servers.map(instance => {
                    return {
                        name: instance.getName(),
                        path: instance.getPath(),
                        domainName: instance.getDomainName()
                    };
                })
            );
        } catch (error) {
            console.error(error.toString());
        }
    }

    public async readServerConfig(): Promise<any> {
        let data = fse.readFileSync(this.serversConfig);
        return await JSON.parse(data.toString());
    }

}