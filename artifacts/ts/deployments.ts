/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { RunScriptResult, DeployContractExecutionResult } from "@alephium/cli";
import { NetworkId } from "@alephium/web3";
import {
  Gift,
  GiftInstance,
  GiftFactory,
  GiftFactoryInstance,
  Giftv2,
  Giftv2Instance,
} from ".";
import { default as mainnetDeployments } from "../../deployments/.deployments.mainnet.json";
import { default as testnetDeployments } from "../../deployments/.deployments.testnet.json";

export type Deployments = {
  deployerAddress: string;
  contracts: {
    GiftFactory: DeployContractExecutionResult<GiftFactoryInstance>;
    Gift?: DeployContractExecutionResult<GiftInstance>;
    Giftv2?: DeployContractExecutionResult<Giftv2Instance>;
  };
};

function toDeployments(json: any): Deployments {
  const contracts = {
    GiftFactory: {
      ...json.contracts["GiftFactory"],
      contractInstance: GiftFactory.at(
        json.contracts["GiftFactory"].contractInstance.address
      ),
    },
    Gift:
      json.contracts["Gift"] === undefined
        ? undefined
        : {
            ...json.contracts["Gift"],
            contractInstance: Gift.at(
              json.contracts["Gift"].contractInstance.address
            ),
          },
    Giftv2:
      json.contracts["Giftv2"] === undefined
        ? undefined
        : {
            ...json.contracts["Giftv2"],
            contractInstance: Giftv2.at(
              json.contracts["Giftv2"].contractInstance.address
            ),
          },
  };
  return {
    ...json,
    contracts: contracts as Deployments["contracts"],
  };
}

export function loadDeployments(
  networkId: NetworkId,
  deployerAddress?: string
): Deployments {
  const deployments =
    networkId === "mainnet"
      ? mainnetDeployments
      : networkId === "testnet"
      ? testnetDeployments
      : undefined;
  if (deployments === undefined) {
    throw Error("The contract has not been deployed to the " + networkId);
  }
  const allDeployments: any[] = Array.isArray(deployments)
    ? deployments
    : [deployments];
  if (deployerAddress === undefined) {
    if (allDeployments.length > 1) {
      throw Error(
        "The contract has been deployed multiple times on " +
          networkId +
          ", please specify the deployer address"
      );
    } else {
      return toDeployments(allDeployments[0]);
    }
  }
  const result = allDeployments.find(
    (d) => d.deployerAddress === deployerAddress
  );
  if (result === undefined) {
    throw Error("The contract deployment result does not exist");
  }
  return toDeployments(result);
}
