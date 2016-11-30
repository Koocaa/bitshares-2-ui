import React from "react";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import cnames from "classnames";
import utils from "common/utils";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "components/Account/AccountBalance";
import connectToStores from "alt/utils/connectToStores";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import AssetName from "components/Utility/AssetName";
import assetUtils from "common/asset_utils";
import BindToChainState from "components/Utility/BindToChainState";
import ChainTypes from "components/Utility/ChainTypes";
import LoadingIndicator from "components/LoadingIndicator";

import DepositWithdraw from "./DepositWithdraw";
import Notice from "./Notice";
import ErrorDisplay from "./ErrorDisplay";

@connectToStores
// @BindToChainState()
export default class TranswiserService extends React.Component {

  static getStores() {
    return [SettingsStore]
  };

  static getPropsFromStores() {
    return {
      viewSettings: SettingsStore.getState().viewSettings
    }
  };

  static propTypes = {
    account: ChainTypes.ChainAccount.isRequired,
  };

  constructor(props) {
    super();

    this.state = {
      service: props.viewSettings.get('transService','gateway'),
      setting: {},
      error: null,
      reload: false
    }

    this.apiUrl = "http://localhost:3000/api/v2/setting";
  }

  componentDidMount(){
    this.getSetting();
  }

  shouldComponentUpdate(nextProps, nextState) {
    let changed = (
      nextProps.account !== this.props.account ||
      nextState.service !== this.state.service ||
      !utils.are_equal_shallow(nextState.setting, this.state.setting)
    );

    return changed;
  }

  getSetting(){
    let params = {headers: new Headers({"Accept": "application/json", "Content-Type": "application/json"})}
    if (this.props.account) {
      params.method = 'post';
      params.body = JSON.stringify({ data: { account: this.props.account.get('name') } });
    } else {
      params.method = 'get';
    }

    console.log('getSetting', this.props.account.get('name'), params);

    fetch(this.apiUrl, params).then(reply => reply.json().then(result => {
      this.setState({
        setting: result,
        error: false
      });
    })).catch(err => { this.onFetchError(err) });
  }

  toggleService(service) {
    if (service == this.state.service) return;

    this.setState({
      service: service
    });

    SettingsActions.changeViewSetting({
      transService: service
    });
  }

  onFetchError(err){
    console.log("error fetching Transwiser service status", err);
    this.setState({
      error: counterpart.translate("gateway.transwiser.fetch_data_error"),
      reload: true
    })
  }

  getDepositAddresses(addrs) {
    let gateway = this.state.setting[this.state.service];

    addrs.forEach(addr => {
      let {coin, address: depositAddress} = addr;

      gateway.forEach(g => {
        if (g.coin == addr.coin) {
          g.depositAddress = depositAddress;
        }
      })
    })
  }

  render() {

    let {account} = this.props;
    let {service, setting, error, reload} = this.state;

    let coins = setting[service];
    let service_explain  = <Translate component="h5" content={"gateway.transwiser."+service+"_text"} />;

    let viewDepositWithdraws = null
    if (coins){
      viewDepositWithdraws = coins.map(coin => {
        return <DepositWithdraw
                  key={service+coin.id}
                  service={service}
                  issuer="transwiser-wallet"
                  account={account.get('name')}
                  setting={coin}
                  asset={coin.asset} />
      });
    }

    if (this.state.service == 'gateway' && setting.addresses) {
        this.getDepositAddresses(setting.addresses);
    }

    return(
      <div>
          <Notice notice={setting.notice} />
          <div className="float-right"><a href="http://www.transwiser.com" target="_blank"><Translate content="gateway.website" /></a></div>

          <div className="button-group">
          {
            setting.gateway && setting.gateway.length > 0 ?
              (<div onClick={this.toggleService.bind(this, "gateway")} className={cnames("button", service === "gateway" ? "active" : "outline")}><Translate content="gateway.gateway" /></div>)
            : null
          }
          {
            setting.bridge && setting.bridge.length > 0 ?
            <div onClick={this.toggleService.bind(this, "bridge")} className={cnames("button", service === "bridge" ? "active" : "outline")}><Translate content="gateway.bridge" /></div>
            : null
          }
          {
            setting.fiat && setting.fiat.length > 0 ?
              <div onClick={this.toggleService.bind(this, "fiat")} className={cnames("button", service === "fiat" ? "active" : "outline")}><Translate content="gateway.fiat" /></div>
            : null
          }
          </div>

          {
            setting.gateway || setting.bridge || setting.fiat ?
            <div style={{paddingBottom: 15}}>{service_explain}</div> :
            null
          }

          { !setting ? <LoadingIndicator /> :
            !coins ? "no services available" :
            <table className="table">
                <thead>
                <tr>
                    <th><Translate content="gateway.symbol" /></th>
                    <th><Translate content="gateway.deposit_to" /></th>
                    <th><Translate content="gateway.balance" /></th>
                    <th><Translate content="gateway.withdraw" /></th>
                </tr>
                </thead>
                <tbody>{viewDepositWithdraws}</tbody>
            </table>
          }

          { error && reload ?  <ErrorDisplay message={error} reload={reload} onReloadClicked={this.getSetting.bind(this)} /> : null }
      </div>
    )
  }

}