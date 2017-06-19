// flow-typed signature: ff3db013b39eed58fa0d021bcba93fd5
// flow-typed version: <<STUB>>/nodegit_v^0.16.0/flow_v0.35.0

declare module 'nodegit' {
  declare export type CredAcquireCb = () => Cred;
  declare type TransportCertificateCheckCb = Function;
  declare type TransferProgressCb = Function;
  declare type TransportCb = Function;
  declare type CheckoutNotifyCb = Function;
  declare type CheckoutPerfdataCb = Function;
  declare type CheckoutProgressCb = Function;

  declare type CheckoutOptions = {
    ancestorLabel?: string,
    baseline?: Tree,
    baselineIndex?: Index,
    checkoutStrategy?: number,
    dirMode?: number,
    disableFilters?: number,
    fileMode?: number,
    fileOpenFlags?: number,
    notifyCb?: CheckoutNotifyCb,
    notifyFlags?: number,
    notifyPayload?: any,
    ourLabel?: string,
    paths?: Array<string>,
    perfdataCb?: CheckoutPerfdataCb,
    perfdataPayload?: any,
    progressCb?: CheckoutProgressCb,
    progressPayload?: any,
    targetDirectory?: string,
    theirLabel?: string,
    version?: number, 
  };

  declare type RemoteCallbacks = {
    certificateCheck?: TransportCertificateCheckCb,
    credentials?: CredAcquireCb,
    payload?: any,
    transferProgress?: TransferProgressCb,
    transport?: TransportCb,
    version?: number,
  };

  declare type ProxyOptions = {
    certificateCheck?: TransportCertificateCheckCb,
    credentials?: CredAcquireCb,
    payload?: any,
    type?: number,
    url?: string,
    version?: number,
  };

  declare type FetchOptions = {
    callbacks?: RemoteCallbacks,
    customHeaders?: Array<string>,
    downloadTags?: number,
    proxyOpts?: ProxyOptions,
    prune?: number,
    updateFetchahead?: number,
    version?: number,
  };

  declare type CloneOptions = {
    bare?: number,
    checkoutBranch?: string,
    checkoutOpts?: CheckoutOptions,
    fetchOpts?: FetchOptions,
    local?: number,
    remoteCbPayload?: any,
    repositoryCbPayload?: any,
    version?: number,
  };

  declare type PushOptions = {
    callbacks?: RemoteCallbacks,
    customHeaders?: Array<string>,
    pbParallelism?: number,
    proxyOpts?: ProxyOptions,
    version?: number,
  };

  declare export type Commit = {
  };

  /**
   * Major Datatypes handled by nodegit
   */
  declare export type Index = {
  };

  declare export type Tree = {
  };

  declare export type Signature = {
    name: string,
    email: string,
    time: number,
    offset: number,
  };

  declare export type Oid = {
  };

  declare export type Repository = {
    path: () => string,
    workdir: () => string,
    isDefaultState: () => boolean,
    createCommitOnHead: (
      filesToAdd: Array<string>,
      author: Signature,
      committer: Signature,
      message: string
    ) => Oid,
    checkoutBranch: (branch: string, opts?: CheckoutOptions) => Promise<void>, 
    getRemote: (remote: string | Remote, cb?: Function) => Promise<Remote>,
    fetchAll: (fetchOptions: FetchOptions, cb?: Function) => Promise<void>,
    rebaseBranches: (branch: string,
                     upstream: string,
                     onto: string,
                     signature: Signature,
                     beforeNextFn?: Function) => Promise<void>,
    getHeadCommit: () => Promise<Commit>,
  };

  declare export type Cred = {
  }

  declare export type Revparse = {
  }

  declare export type Remote = {
    push: (refSpec: Array<string>, opt?: PushOptions, cb?: Function) => Promise<void>,
  }

  declare type NodeGit = {
    Signature: {
      create: (name: string, email: string, time: number, offset: number) => Signature;
    },
    Repository: {
      open: (path: string) => Promise<Repository>,
    },
    Revparse: {
      MODE: {
        SINGLE: number,
        RANGE: number,
        MERGE_BASE: number,
      },
      single: (repo: Repository, spec: string) => Promise<Revparse>,
    },
    Clone: {
      clone: (url: string, local_path: string, options: CloneOptions) => Promise<Repository>,
    },
    Cred: {
      userpassPlaintextNew: (username: string, password: string) => Cred,
    }
  };

  declare export default NodeGit;
}
