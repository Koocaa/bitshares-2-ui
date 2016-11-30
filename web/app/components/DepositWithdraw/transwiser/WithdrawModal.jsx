import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import {ChainStore} from "graphenejs-lib";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import BalanceComponent from "components/Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";
import AccountActions from "actions/AccountActions";
import Utils from "common/utils.js";


@BindToChainState({keep_updating:true})
export default class WithdrawModal extends React.Component {

   static propTypes = {
       account:         ChainTypes.ChainAccount.isRequired,
       issuerAccount:   ChainTypes.ChainAccount.isRequired,
       withdrawAsset:   ChainTypes.ChainAsset.isRequired,
       receiveAsset:    React.PropTypes.string.isRequired,
       fee:             React.PropTypes.number.isRequired,
       memo_prefix:     React.PropTypes.string
   }

   constructor( props ) {
      super(props);
      this.state = {
         withdraw_amount:null,
         withdraw_address:null,
         withdraw_amount_after_fee:null,
         balance_error: false,
         form_valid: false
      }

      let balanceAmount = null;
   }

   onWithdrawAmountChange( {amount, asset} ) {
      if (!this.balanceAmount || this.balanceAmount == 0 || !amount || !asset) {
          this.setState( {
              withdraw_amount: 0,
              withdraw_amount_after_fee: 0,
              balance_error: true
          } );
      } else {
          let should_receive = parseInt(amount.replace(/,/g, ""));
          should_receive = should_receive - should_receive * this.props.fee;
          should_receive = Math.floor(should_receive*100)/100;
          this.setState( {
              withdraw_amount: amount,
              withdraw_amount_after_fee: should_receive,
              balance_error: amount > this.balanceAmount
          } );
      }
   }

   onWithdrawAddressChanged( e ) {
      this.setState( {withdraw_address:e.target.value} );
   }

   formSubmit(e) {
     e.preventDefault();
     let asset = this.props.withdrawAsset;
     let precision = Utils.get_asset_precision(asset.get("precision"));
     let amount = this.state.withdraw_amount.replace( /,/g, "" )
     AccountActions.transfer(
         this.props.account.get("id"),
         this.props.issuerAccount.get("id"),
         parseInt(amount * precision, 10),
         asset.get("id"),
         (this.props.memo_prefix || "") + this.state.withdraw_address
     )
   }

   formValid(){
     return !!(!this.state.balanceError && this.state.withdraw_address)
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
       let balance = null;
       let account_balances = this.props.account.get("balances").toJS();
       let asset_types = Object.keys(account_balances);

       if (asset_types.length > 0) {
           let current_asset_id = this.props.withdrawAsset.get('id');
           if( current_asset_id ){
               balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
              if (account_balances[current_asset_id]) {
                  this.balanceAmount = parseInt(ChainStore.getObject(account_balances[current_asset_id]).get('balance'))/Math.pow(10,parseInt(this.props.withdrawAsset.get('precision')));
              }
           } else {
              balance = "No funds";
              this.balanceAmount = 0;
           }
       } else {
           balance = "No funds";
           this.balanceAmount = 0;
       }


       return (<form className="grid-block vertical full-width-content">
                 <div className="grid-container">
                   <div className="content-block">
       <h3><Translate content="gateway.transwiser.withdraw_title" withdrawAsset={this.getAssetName(this.props.withdrawAsset)} receiveAsset={this.props.receiveAsset} /></h3>
                   </div>
                   <div className="content-block">
                       <p><Translate content="gateway.transwiser.withdraw_note" /></p>
                   </div>
                   <div className="content-block">
                     <AmountSelector label="modal.withdraw.amount"
                                     amount={this.state.withdraw_amount}
                                     asset={this.props.withdrawAsset.get('id')}
                                     assets={[this.props.withdrawAsset.get('id')]}
                                     placeholder="0.0"
                                     onChange={this.onWithdrawAmountChange.bind(this)}
                                     display_balance={balance}
                                     />
                                     { this.state.balance_error ? <div className="has-error"><Translate content="transfer.errors.insufficient" /></div> : null }
                        <br />
                        <div className="grid-block">
                            <Translate content="transfer.fee" />: {Utils.percentagize(this.props.fee)}
                            { this.state.withdraw_amount_after_fee > 0 ? <span> (<Translate content="gateway.transwiser.you_will_receive" amount={this.state.withdraw_amount_after_fee} />)</span> : null }
                        </div>
                   </div>
                   <div className="content-block full-width-content">
                       <label><Translate component="span" content="gateway.transwiser.alipay"/></label>
                       <input type="text" value={this.state.withdraw_address} tabIndex="4" onChange={this.onWithdrawAddressChanged.bind(this)} autoComplete="off"/>
                   </div>

                   <div className="content-block">
                            <input type="submit" className="button"
                                   onClick={this.formSubmit.bind(this)}
                                   value={counterpart.translate("modal.withdraw.submit")} />
                       <Trigger close={this.props.modalId}>
                           <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                       </Trigger>
                   </div>
                 </div>
               </form>)
   }
};