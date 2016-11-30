import React from "react";
import counterpart from "counterpart";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "components/Account/AccountBalance";
import notify from "actions/NotificationActions";

import FiatDepositModal from "./FiatDepositModal";
import WithdrawModal from "./WithdrawModal";

@BindToChainState({keep_updating: true})
export default class DepositWithdraw extends React.Component {

  static propTypes = {
    service:     React.PropTypes.string.isRequired,
    issuer:      ChainTypes.ChainAccount,
    account:     ChainTypes.ChainAccount.isRequired,
    asset:       ChainTypes.ChainAsset,
    setting:     React.PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
  }

  render() {
    let loading = <tr style={{display:"block",textAlign:"center"}}><td colSpan="4">Loading ... </td></tr>;

    if( !this.props.account || !this.props.issuer || !this.props.setting || !this.props.asset )
        return loading;

    let {id, coin, ad, aw} = this.props.setting;
    let {service, account, asset, issuer} = this.props;

    let depositContent = "";
    let withdrawContent = "";

    switch (service) {
      case 'fiat':
        depositContent = <FiatDepositButton setting={this.props.setting} issuer={issuer.get('name')} asset={asset.get('symbol')} />;
        withdrawContent = <FiatWithdrawButton setting={this.props.setting} account={account.get('name')} asset={asset.get('symbol')} issuer={issuer.get('name')} />;
        break;
      case 'gateway':
        // depositContent = <GatewayDepositButton setting={this.props.setting} issuer={issuer.get('name')} asset={asset.get('symbol')} />;
        depositContent = <GatewayDepositButton {...this.props} />;
        withdrawContent = <FiatWithdrawButton setting={this.props.setting} account={account.get('name')} asset={asset.get('symbol')} issuer={issuer.get('name')} />;
    }

    return <tr key={service+id}>
        <td>{coin} </td>
        <td>{ !ad ? <Translate content="gateway.transwiser.deposit_disabled" /> : depositContent }</td>
        <td> <AccountBalance account={this.props.account.get('name')} asset={asset.get('symbol')} /> </td>
        <td>{ !aw ? <Translate content="gateway.transwiser.withdraw_disabled" /> : withdrawContent }</td>
    </tr>
  }
}

class GatewayDepositButton extends React.Component {
  constructor(props){
    super(props);

    // TODO: move api to global config
    this.requestNewAddressApiUrl = "http://localhost:3000/api/v2/request_address";
    this.state = { depositAddress: props.setting.depositAddress || null }
  }

  onRequestNewAddress(){
    console.log('onRequestNewAddress: ' + this.requestNewAddressApiUrl);
    let params = {
      headers: new Headers({"Accept": "application/json", "Content-Type": "application/json"}),
      method: "post",
      body: JSON.stringify({ data: { account: this.props.account.get('name'), coin: this.props.setting.coin } })
    };


    console.log(params);
    fetch(this.requestNewAddressApiUrl, params).then(reply => reply.json().then(result => {
      console.log(result);

      if (result.success && result.success === true) {
        new_addr = result.data.address || "";
        notify.addNotification({
            message: `${counterpart.translate("gateway.generate_new_succ", {address: new_addr})}`,
            level: "success",
            autoDismiss: 10
        });
        this.setState({ depositAddress: new_addr });
      } else {
        this.onNewAddressError(result.error || "Error");
      }

    })).catch(err => { this.onNewAddressError(err) });
  }

  onNewAddressError(err){
    notify.addNotification({
        message: `${counterpart.translate("gateway.generate_new_fail", {reason: err})}`,
        level: "error",
        autoDismiss: 10
    });
  }

  render(){
    return <div>
      <span style={{marginRight:"1rem"}}>{this.state.depositAddress}</span>
      <button className="button outline" onClick={this.onRequestNewAddress.bind(this)}><Translate content="gateway.generate_new" /></button>
    </div>
  }
}

class FiatDepositButton extends React.Component {
  getDepositModalId() {
    return "deposit" + this.getModalId();
  }

  getModalId() {
    return "_asset_"+this.props.issuer + "_"+this.props.setting.id;
  }

  onDeposit() {
    ZfApi.publish(this.getDepositModalId(), "open");
  }

  render(){
    let {asset, issuer} = this.props;
    let {id, coin, deposit_url, qr, deposit_fee, withdraw_fee} = this.props.setting;

    let depositModalId  = this.getDepositModalId();

    return <div>
            <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
            <Modal id={depositModalId} overlay={true}>
              <Trigger close={depositModalId}>
                <a href="#" className="close-button">&times;</a>
              </Trigger>
              <br/>
              <div className="grid-block vertical">
                <FiatDepositModal
                  issuerAccount={issuer}
                  depositUrl={deposit_url}
                  qr={qr}
                  fee={Number(deposit_fee)}
                  depositAsset={coin}
                  receiveAsset={asset}
                  modalId={depositModalId} />
              </div>
            </Modal>
          </div>
  }
}

class FiatWithdrawButton extends React.Component {
  getWithdrawModalId() {
    return "withdraw" + this.getModalId();
  }

  getModalId() {
    return "_asset_"+this.props.issuer + "_"+this.props.setting.id;
  }

  onWithdraw() {
    // console.log('onWithdraw', this.getWithdrawModalId());
    ZfApi.publish(this.getWithdrawModalId(), "open");
  }

  render(){
    let {account, issuer, asset} = this.props;
    let {id, coin, deposit_fee, withdraw_fee} = this.props.setting;

    let withdrawModalId = this.getWithdrawModalId();

    return <div>
            <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
            <Modal id={withdrawModalId} overlay={true}>
                <Trigger close={withdrawModalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <br/>
                <div className="grid-block vertical">
                    <WithdrawModal
                        account={account}
                        issuerAccount={issuer}
                        withdrawAsset={asset}
                        receiveAsset={coin}
                        fee={Number(withdraw_fee)}
                        modalId={withdrawModalId} />
                </div>
            </Modal>
          </div>
  }
}
