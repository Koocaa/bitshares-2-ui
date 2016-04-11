import React from "react";
import {Link} from "react-router";
import connectToStores from "alt/utils/connectToStores";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import LoadingIndicator from "../LoadingIndicator";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import Statistics from "./Statistics";
import AccountActions from "actions/AccountActions";
import Icon from "../Icon/Icon";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import accountUtils from "common/account_utils";

@connectToStores
class AccountRefererStats extends React.Component {
    static propTypes = {
        accountName: React.PropTypes.string.isRequired
    }

    static getStores() {
        return [AccountStore]
    }

    static getPropsFromStores() {
        return AccountStore.getState()
    }

    render(){
        let stats = this.props.referral_stats;

        return (
            <div>
            <section className="content-block">
                <div className="medium-12"><Translate content="account.member.your_referal_link" />: <span style={{borderBottom:"1px solid #444", padding:"5px 10px"}}>https://bitshares.dacplay.org?r={this.props.accountName}</span></div>
            </section>
            {
                stats ? (
                    <section>
                        <table role="grid" className="refer-stats">
                            <caption><Translate content="account.member.referral_stats_for" name={this.props.accountName} /></caption>
                            <thread>
                                <tr>
                                    <th><Translate content="account.member.basic" /></th>
                                    <th><Translate content="account.member.annual" /></th>
                                    <th><Translate content="account.member.lifetime" /></th>
                                </tr>
                            </thread>
                            <tbody>
                                <tr>
                                    <td>{stats.basic}</td>
                                    <td>{stats.annual}</td>
                                    <td>{stats.lifetime}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                ) : null
            }
            </div>
        );
    }
}

@BindToChainState({keep_updating:false})
class AccountMembership extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        gprops: ChainTypes.ChainObject.isRequired,
        dprops: ChainTypes.ChainObject.isRequired
    }
    static defaultProps = {
        gprops: "2.0.0",
        dprops: "2.1.0"
    }

    upgradeAccount(id, lifetime, e) {
        e.preventDefault();
        AccountActions.upgradeAccount(id, lifetime);
    }

    componentWillMount() {
        accountUtils.getFinalFeeAsset(this.props.account, "account_upgrade");
    }

    render() {

        console.log("location", window.location.origin);
        let gprops = this.props.gprops;
        let dprops = this.props.dprops;

        let account = this.props.account.toJS();

        let ltr = ChainStore.getAccount( account.lifetime_referrer );
        if( ltr ) account.lifetime_referrer_name = ltr.get('name');
        let ref = ChainStore.getAccount( account.referrer );
        if( ref ) account.referrer_name = ref.get('name');
        let reg = ChainStore.getAccount( account.registrar );
        if( reg ) account.registrar_name = reg.get('name');

        let account_name = account.name;

        let network_fee  = account.network_fee_percentage/100;
        let lifetime_fee = account.lifetime_referrer_fee_percentage/100;
        let referrer_total_fee = 100 - network_fee - lifetime_fee;
        let referrer_fee  = referrer_total_fee * account.referrer_rewards_percentage/10000;
        let registrar_fee = 100 - referrer_fee - lifetime_fee - network_fee;

        gprops = gprops.toJS();
        dprops = dprops.toJS();

        let member_status = ChainStore.getAccountMemberStatus(this.props.account);
        let membership = "account.member." + member_status;
        let expiration = null
        if( member_status === "annual" )
           expiration = (<span>(<Translate content="account.member.expires"/> <TimeAgo time={account.membership_expiration_date} />)</span>)
        let expiration_date = account.membership_expiration_date;
        if( expiration_date === "1969-12-31T23:59:59" )
           expiration_date = "Never"
        else if( expiration_date === "1970-01-01T00:00:00" )
           expiration_date = "N/A"

        let core_asset = ChainStore.getAsset("1.3.0");
        let lifetime_cost = gprops.parameters.current_fees.parameters[8][1].membership_lifetime_fee*gprops.parameters.current_fees.scale/10000;
        let annual_cost = gprops.parameters.current_fees.parameters[8][1].membership_annual_fee*gprops.parameters.current_fees.scale/10000;
        // get referral stats for premium member
        if (member_status === "lifetime" || member_status === "annual") {
            AccountActions.fetchReferralStats(account.name)
        }

        return (
            <div className="grid-content" style={{overflowX: "hidden"}}>
                <div className="content-block no-margin">
                    <h3><Translate content={membership}/> {expiration}</h3>
                    {/* referral links and stats */}
                    { member_status === "lifetime" || member_status === "annual" ? (
                        <AccountRefererStats accountName={account.name} />
                    ) : (
                        <div><span className="info label"><Translate content="account.member.note" /></span> <Translate content="account.member.upgrade_notice_for_referral_link" /></div>
                    )}

                    { member_status === "lifetime" ? null : (
                       <div>
                           <div className="large-6 medium-8">
                               <HelpContent path="components/AccountMembership" section="lifetime" feesCashback={100 - network_fee} price={{amount: lifetime_cost, asset: core_asset}}/>
                               { member_status === "annual" ? null : (
                                  <HelpContent path="components/AccountMembership" section="annual" feesCashback={100 - network_fee - lifetime_fee} price={{amount: annual_cost, asset: core_asset}}/>
                               )}
                               <div href className="button no-margin" onClick={this.upgradeAccount.bind(this, account.id, true)}>
                                   <Translate content="account.member.upgrade_lifetime"/>
                               </div> &nbsp; &nbsp;
                               {true || member_status === "annual" ? null :
                               <div href className="button" onClick={this.upgradeAccount.bind(this, account.id, false)}>
                                   <Translate content="account.member.subscribe"/>
                               </div>}
                            </div>
                       <br/><hr/>
                       </div>
                    )}
                </div>

                <div className="content-block no-margin">
                <div className="no-margin grid-block vertical large-horizontal">
                    <div className="no-margin grid-block large-5">
                        <div className="grid-content">
                            <h4><Translate content="account.member.fee_allocation"/></h4>
                            <table className="table key-value-table">
                                <tbody>
                                    <tr>
                                        <td><Translate content="account.member.network_percentage"/></td>
                                        <td>{network_fee}%</td>
                                    </tr>
                                    <tr>
                                        <td><Translate content="account.member.lifetime_referrer"/>  &nbsp;
                                        (<Link to={`account/${account.lifetime_referrer_name}/overview`}>{account.lifetime_referrer_name}</Link>)
                                        </td>
                                        <td>{lifetime_fee}%</td>
                                    </tr>
                                    <tr>
                                        <td><Translate content="account.member.registrar"/>  &nbsp;
                                        (<Link to={`account/${account.registrar_name}/overview`}>{account.registrar_name}</Link>)
                                        </td>
                                        <td>{registrar_fee}%</td>
                                    </tr>
                                    <tr>
                                        <td><Translate content="account.member.referrer"/>  &nbsp;
                                        (<Link to={`account/${account.referrer_name}/overview`}>{account.referrer_name }</Link>)
                                        </td>
                                        <td>{referrer_fee}%</td>
                                    </tr>
                                    <tr>
                                        <td><Translate content="account.member.membership_expiration"/> </td>
                                        <td>{expiration_date}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <h4 style={{paddingTop: "1rem"}}><Translate content="account.member.fees_cashback"/></h4>
                            <table className="table key-value-table">
                                <Statistics stat_object={account.statistics}/>
                            </table>
                        </div>
                    </div>
                    <div className="grid-block large-7">
                        <div className="grid-content">
                            <HelpContent path="components/AccountMembership"
                                         section="fee-division"
                                         account={account_name}
                                         networkFee={network_fee}
                                         referrerFee={referrer_fee}
                                         registrarFee={registrar_fee}
                                         lifetimeFee={lifetime_fee}
                                         referrerTotalFee={referrer_total_fee}
                                         maintenanceInterval={gprops.parameters.maintenance_interval}
                                         nextMaintenanceTime={{time: dprops.next_maintenance_time}}
                                         vestingThreshold={{amount: gprops.parameters.cashback_vesting_threshold, asset: core_asset}}
                                         vestingPeriod={gprops.parameters.cashback_vesting_period_seconds/60/60/24}/>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        );
    }
}

export default AccountMembership;
