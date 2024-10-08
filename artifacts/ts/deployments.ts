/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { RunScriptResult, DeployContractExecutionResult } from "@alephium/cli";
import { NetworkId } from "@alephium/web3";
import { Gift, GiftInstance, GiftFactory, GiftFactoryInstance } from ".";
import { default as testnetDeployments } from "../../deployments/.deployments.testnet.json";

export type Deployments = {
  deployerAddress: string;
  contracts: {
    Gift: DeployContractExecutionResult<GiftInstance>;
    GiftFactory: DeployContractExecutionResult<GiftFactoryInstance>;
  };
};

function toDeployments(json: any): Deployments {
  const contracts = {
    Gift: {
      ...json.contracts["Gift"],
      contractInstance: Gift.at(
        json.contracts["Gift"].contractInstance.address
      ),
    },
    GiftFactory: {
      ...json.contracts["GiftFactory"],
      contractInstance: GiftFactory.at(
        json.contracts["GiftFactory"].contractInstance.address
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
  const deployments = networkId === "testnet" ? testnetDeployments : undefined;
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
