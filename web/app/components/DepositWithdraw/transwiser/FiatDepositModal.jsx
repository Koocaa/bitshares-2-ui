import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import AccountBalance from "components/Account/AccountBalance";
import Utils from "common/utils.js";

@BindToChainState({keep_updating:true})
export default class FiatDepositModal extends React.Component {

    static propTypes =
    {
        issuerAccount:     ChainTypes.ChainAccount.isRequired,
        depositUrl:        React.PropTypes.string.isRequired,
        qr:                React.PropTypes.string.isRequired,
        fee:               React.PropTypes.number.isRequired,
        depositAsset:      React.PropTypes.string.isRequired,
        receiveAsset:      ChainTypes.ChainAsset.isRequired,
        modalId:           React.PropTypes.string.isRequired
    }

   gotoShop(){
       window.open(this.props.depositUrl);
   }

   // return asset name, if it's bitasset, should return with bit prefix
   // @param asset[ChainAsset]
   //
   getAssetName(asset){
     let isBitAsset = asset.has("bitasset") && asset.get("issuer") === "1.2.0";
     let isPredMarket = isBitAsset && asset.getIn(["bitasset", "is_prediction_market"]);

     let {name: replacedName, prefix} = Utils.replaceName(asset.get('symbol'), isBitAsset && !isPredMarket);
     return prefix ? prefix + replacedName : replacedName;
   }

   render() {
       return (
           <div className="grid-block vertical full-width-content">
               <div className="grid-container">
                   <div className="content-block">
                       <h3><Translate content="gateway.transwiser.deposit_title" depositAsset={"CNY"} receiveAsset={this.getAssetName(this.props.receiveAsset)} /></h3>
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.inventory" /></label>
                       <AccountBalance account={this.props.issuerAccount.get('name')} asset={this.props.receiveAsset.get('symbol')} />
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.transwiser.visit_weidian" /></label>
                       <a onClick={this.gotoShop.bind(this)} href={this.props.depositUrl} target="_blank">{this.props.depositUrl}</a>
                    </div>
                    <div className="content-block">
                       <label><Translate content="gateway.scan_qr" /></label>
                       <img src={this.props.qr} />
                    </div>

                   <div className="content-block">
                       <label><Translate content="transfer.fee" /></label>
                       {Utils.percentagize(this.props.fee)}
                   </div>
                    <div className="content-block">
                       <Trigger close={this.props.modalId}>
                           <div className="button"><Translate content="modal.ok" /></div>
                       </Trigger>
                    </div>
               </div>
           </div>
       )
   }

};
