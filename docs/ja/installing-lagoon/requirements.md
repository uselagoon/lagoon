# 既存のKubernetesクラスターへのLagoonのインストール

## 必要条件 { #requirements }

* Kubernetes 1.23+(Kubernetes 1.21もサポートされていますが、1.23を推奨します)
* [Helm](https://helm.sh)、[Helm Charts](https://helm.sh/docs/topics/charts/#helm)、[kubectl](https://kubernetes.io/docs/tasks/tools/)に精通していること。
* Ingressコントローラー、我々は[ingress-nginx](https://github.com/kubernetes/ingress-nginx)を推奨し、ingress-nginx名前空間にインストールされていること
* Cert manager(TLS用) - letsencryptの使用を強く推奨します
* StorageClasses(デフォルトとしてRWO、永続タイプ用にRWM)

!!! Note "注意:"
    これは多くのステップが必要であることを認識しており、今後すぐに行う予定のロードマップには、このプロセスのステップ数を減らすことが含まれています。

## 特定の要件 (2023年1月現在) { #specific-requirements-as-of-january-2023 }

### Kubernetes

LagoonはKubernetesバージョン1.21以降をサポートしています。私たちは積極的にKubernetes 1.24に対してテストと開発を行っており、定期的に1.21、1.22、1.25に対してもテストを行っています。

次の大規模な破壊的変更は[Kubernetes 1.25](https://kubernetes.io/docs/reference/using-api/deprecation-guide/#v1-25)にあり、我々はこれらを事前に把握する努力をしますが、これは最低サポートバージョンの上昇を必要とするでしょう。 Lagoonのバージョン。

### ingress-nginx

Lagoonは現在、単一の `ingress-nginx` コントローラーのみに対応して設定されているため、過去には `IngressClass` の定義は必要ありませんでした。

最近の `ingress-nginx` コントローラー(バージョン4以降、Kubernetes 1.22が必要)を使用するには、以下の設定を使用する必要があります。[`ingress-nginx` のドキュメント](https://kubernetes.github.io/ingress-nginx/#what-is-an-ingressclass-and-why-is-it-important-for-users-of-ingress-nginx-controller-now)に従ってください。

* `nginx-ingress` はデフォルトのコントローラーとして設定する必要があります - Helmの値で `.controller.ingressClassResource.default: true` を設定します
* `nginx-ingress` は `IngressClass` が設定されていないIngressを監視するように設定する必要があります - Helmの値で `.controller.watchIngressWithoutClass: true` を設定します

これにより、コントローラーは新しいIngressを `IngressClass` として自身で作成し、`IngressClass` が設定されていない既存のIngressを処理するように設定されます。

他の設定も可能かもしれませんが、テストは行われていません。

### Harbor { #harbor }

現在、Harbor のバージョン 2.1 および 2.2+ がサポートされています。ロボット アカウントを取得する方法は 2.2 で変更され、Lagoon リモート コントローラーはこれらのトークンを処理できます。つまり、Harbor は `lagoon-core` ではなく `lagoon-build-deploy` の資格情報を使用して構成する必要があります。

[2.6.0](https://github.com/goharbor/harbor/releases/tag/v2.6.0) 以降の Harbor バージョンを、Helm チャート [1.10.0](https://github.com/goharbor/harbor-helm/releases/tag/v1.10.0) 以上とともにインストールすることをお勧めします。

### バックアップ用の k8up { #k8up-for-backups }

Lagoon には、[K8up](https://k8up.io/k8up/1.2/index.html) バックアップ オペレーターの構成が組み込まれています。 Lagoon では、事前バックアップ ポッド、スケジュール、保持期間を設定し、K8up のバックアップと復元を管理できます。現在、Lagoon は、v2 以降の名前空間の変更により、K8up の 1.x バージョンのみをサポートしていますが、修正に取り組んでいます。

!!! Bug "バグ k8up v2"
    Lagoon は、名前空間の変更により、現在 K8up v2 以降をサポートしていません ([こちら](https://github.com/uselagoon/build-deploy-tool/issues/121))。

K8up バージョン [1.2.0](https://github.com/k8up-io/k8up/releases/tag/v1.2.0) を Helm Chart [1.1.0](https://github.com/appuio/charts/releases/tag/k8up-1.1.0) とともにインストールすることをお勧めします。





### ストレージプロビジョナー { #storage-provisioners }

Lagoon は、ほとんどのワークロードに対してデフォルトの `standard` `StorageClass` を利用し、ほとんどの Kubernetes プラットフォームの内部プロビジョナーで十分です。これは、可能な場合は動的プロビジョニングと拡張が可能になるように構成する必要があります。

また、Lagoonでは、永続的なポッドレプリカ(ノード間)をサポートするために、'bulk'と呼ばれる`StorageClass`が利用可能であることが必要です。この`StorageClass`は`ReadWriteMany`(RWX)アクセスモードをサポートしており、可能な限り動的なプロビジョニングと拡張性があるように設定する必要があります。詳細はhttps://kubernetes.io/docs/concepts/storage/persistent-volumes/#access-modes を参照し、互換性のあるドライバの完全なリストについては[production drivers list](https://kubernetes-csi.github.io/docs/drivers.html)を参照してください。

現在、私たちは(現在は廃止されている)[EFS Provisioner](./efs-provisioner.md)の指示だけを含めています。本番の[EFS CSI driver](https://github.com/kubernetes-sigs/aws-efs-csi-driver)は、120以上のPVCをプロビジョニングする際に問題があります。私たちはアップストリームでの可能な修正を[ここ](https://github.com/kubernetes-sigs/aws-efs-csi-driver/pull/761)と[ここ](https://github.com/kubernetes-sigs/aws-efs-csi-driver/pull/732)で待っています - しかし、他のほとんどのプロバイダのCSIドライバも動作するはずで、NFS互換のサーバとプロビジョナーを備えた設定も同様です。

## どれくらい Kubernetesの経験/知識は必要ですか？

Lagoonは、非常に高度なKubernetesとクラウドネイティブの概念を使用しており、Lagoonのインストールや設定に完全な熟知が必要なわけではありませんが、問題の診断や貢献は、十分な知識がなければ難しくなるかもしれません。

指標として、[Certified Kubernetes Administrator](https://www.cncf.io/certification/cka/)のカリキュラムに対する快適さを最低限として提案することができます。
