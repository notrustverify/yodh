/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  EventSubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  multicallMethods,
  fetchContractState,
  Asset,
  ContractInstance,
  getContractEventsCurrentCount,
  TestContractParamsWithoutMaps,
  TestContractResultWithoutMaps,
  SignExecuteContractMethodParams,
  SignExecuteScriptTxResult,
  signExecuteMethod,
  addStdIdToFields,
  encodeContractFields,
  Narrow,
} from "@alephium/web3";
import { default as GiftFactoryContractJson } from "../GiftFactory.ral.json";
import { getContractByCodeHash, registerContract } from "./contracts";
import { DIAOracleValue, AllStructs } from "./types";

// Custom types for the contract
export namespace GiftFactoryTypes {
  export type Fields = {
    oracle: HexString;
    giftTemplateId: HexString;
  };

  export type State = ContractState<Fields>;

  export type GiftCreatedEvent = ContractEvent<{
    newGiftId: HexString;
    by: Address;
  }>;

  export interface CallMethodTable {
    createGift: {
      params: CallContractParams<{
        hashedSecret: HexString;
        announcementLockIntervall: bigint;
        version: bigint;
        isCancellable: boolean;
        announcedAddress: Address;
        announcementLockedUntil: bigint;
        givenTokenId: HexString;
        amount: bigint;
      }>;
      result: CallContractResult<null>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };
  export type MulticallReturnType<Callss extends MultiCallParams[]> = {
    [index in keyof Callss]: MultiCallResults<Callss[index]>;
  };

  export interface SignExecuteMethodTable {
    createGift: {
      params: SignExecuteContractMethodParams<{
        hashedSecret: HexString;
        announcementLockIntervall: bigint;
        version: bigint;
        isCancellable: boolean;
        announcedAddress: Address;
        announcementLockedUntil: bigint;
        givenTokenId: HexString;
        amount: bigint;
      }>;
      result: SignExecuteScriptTxResult;
    };
  }
  export type SignExecuteMethodParams<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["params"];
  export type SignExecuteMethodResult<T extends keyof SignExecuteMethodTable> =
    SignExecuteMethodTable[T]["result"];
}

class Factory extends ContractFactory<
  GiftFactoryInstance,
  GiftFactoryTypes.Fields
> {
  encodeFields(fields: GiftFactoryTypes.Fields) {
    return encodeContractFields(
      addStdIdToFields(this.contract, fields),
      this.contract.fieldsSig,
      AllStructs
    );
  }

  eventIndex = { GiftCreated: 0 };

  at(address: string): GiftFactoryInstance {
    return new GiftFactoryInstance(address);
  }

  tests = {
    createGift: async (
      params: TestContractParamsWithoutMaps<
        GiftFactoryTypes.Fields,
        {
          hashedSecret: HexString;
          announcementLockIntervall: bigint;
          version: bigint;
          isCancellable: boolean;
          announcedAddress: Address;
          announcementLockedUntil: bigint;
          givenTokenId: HexString;
          amount: bigint;
        }
      >
    ): Promise<TestContractResultWithoutMaps<null>> => {
      return testMethod(this, "createGift", params, getContractByCodeHash);
    },
  };

  stateForTest(
    initFields: GiftFactoryTypes.Fields,
    asset?: Asset,
    address?: string
  ) {
    return this.stateForTest_(initFields, asset, address, undefined);
  }
}

// Use this object to test and deploy the contract
export const GiftFactory = new Factory(
  Contract.fromJson(
    GiftFactoryContractJson,
    "",
    "9d9906ab133914919c51be4aa39a11b9c7c89b216e015b343baf5cad38e32565",
    AllStructs
  )
);
registerContract(GiftFactory);

// Use this class to interact with the blockchain
export class GiftFactoryInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<GiftFactoryTypes.State> {
    return fetchContractState(GiftFactory, this);
  }

  async getContractEventsCurrentCount(): Promise<number> {
    return getContractEventsCurrentCount(this.address);
  }

  subscribeGiftCreatedEvent(
    options: EventSubscribeOptions<GiftFactoryTypes.GiftCreatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      GiftFactory.contract,
      this,
      options,
      "GiftCreated",
      fromCount
    );
  }

  view = {
    createGift: async (
      params: GiftFactoryTypes.CallMethodParams<"createGift">
    ): Promise<GiftFactoryTypes.CallMethodResult<"createGift">> => {
      return callMethod(
        GiftFactory,
        this,
        "createGift",
        params,
        getContractByCodeHash
      );
    },
  };

  transact = {
    createGift: async (
      params: GiftFactoryTypes.SignExecuteMethodParams<"createGift">
    ): Promise<GiftFactoryTypes.SignExecuteMethodResult<"createGift">> => {
      return signExecuteMethod(GiftFactory, this, "createGift", params);
    },
  };
}
