import React, { Component, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'react-redux'
import { showAlert } from '../actions/Alert'

import Modal from './modal'
import Review from './review'
import UserCard from './user-card'

import data from '../data'

// temporary - we should be getting an origin instance from our app,
// not using a global singleton
import origin from '../services/origin'

class ListingsDetail extends Component {

  constructor(props) {
    super(props)

    this.STEP = {
      VIEW: 1,
      METAMASK: 2,
      PROCESSING: 3,
      PURCHASED: 4,
    }

    this.state = {
      loading: true,
      pictures: [],
      reviews: [],
      purchases: [],
      step: this.STEP.VIEW,
    }

    this.handleBuyClicked = this.handleBuyClicked.bind(this)
  }

  async loadListing() {
    try {
      const listing = await origin.listings.get(this.props.listingAddress)
      const obj = Object.assign({}, listing, { loading: false, reviews: data.reviews})
      this.setState(obj)
    } catch (error) {
      this.props.showAlert('There was an error loading this listing.')
      console.error(`Error fetching contract or IPFS info for listing: ${this.props.listingAddress}`)
      console.log(error)
    }
  }

  async loadPurchases() {
    const address = this.props.listingAddress
    const length = await origin.listings.purchasesLength(address)
    console.log('Purchase count:', length)
    for(let i = 0; i < length; i++){
      let purchaseAddress = await origin.listings.purchaseAddressByIndex(address, i)
      let purchase = await origin.purchases.get(purchaseAddress)
      console.log('Purchase:', purchase)
      this.setState((prevState) => {
        return {purchases: [...prevState.purchases, purchase]};
      });
    }
  }

  componentWillMount() {
    if (this.props.listingAddress) {
      // Load from IPFS
      this.loadListing()
      this.loadPurchases()
    }
    else if (this.props.listingJson) {
      const obj = Object.assign({}, this.props.listingJson, { loading: false })
      // Listing json passed in directly
      this.setState(obj)
    }
  }

  async handleBuyClicked() {
    const unitsToBuy = 1
    const totalPrice = (unitsToBuy * this.state.price)
    this.setState({step: this.STEP.METAMASK})
    try {
      const transactionReceipt = await origin.listings.buy(this.state.address, unitsToBuy, totalPrice)
      console.log('Purchase request sent.')
      this.setState({step: this.STEP.PROCESSING})
      await origin.contractService.waitTransactionFinished(transactionReceipt.transactionHash)
      this.setState({step: this.STEP.PURCHASED})
    } catch (error) {
      window.err = error
      console.log(error)
      this.props.showAlert("There was a problem purchasing this listing.\nSee the console for more details.")
      this.setState({step: this.STEP.VIEW})
    }
  }


  render() {
    return (
      <div className="listing-detail">
        {this.state.step===this.STEP.METAMASK &&
          <Modal backdrop="static" isOpen={true}>
            <div className="image-container">
              <img src="images/spinner-animation.svg" role="presentation"/>
            </div>
            Confirm transaction<br />
            Press &ldquo;Submit&rdquo; in MetaMask window
          </Modal>
        }
        {this.state.step===this.STEP.PROCESSING &&
          <Modal backdrop="static" isOpen={true}>
            <div className="image-container">
              <img src="images/spinner-animation.svg" role="presentation"/>
            </div>
            Processing your purchase<br />
            Please stand by...
          </Modal>
        }
        {this.state.step===this.STEP.PURCHASED &&
          <Modal backdrop="static" isOpen={true}>
            <div className="image-container">
              <img src="images/circular-check-button.svg" role="presentation"/>
            </div>
            Purchase was successful.<br />
            <a href="#" onClick={e => {
              e.preventDefault()
              window.location.reload()
            }}>
              Reload page
            </a>
          </Modal>
        }
        {(this.state.loading || (this.state.pictures && this.state.pictures.length)) &&
          <div className="carousel">
            {this.state.pictures.map(pictureUrl => (
              <div className="photo" key={pictureUrl}>
                {(new URL(pictureUrl).protocol === "data:") &&
                  <img src={pictureUrl} role='presentation' />
                }
              </div>
            ))}
          </div>
        }
        <div className={`container listing-container${this.state.loading ? ' loading' : ''}`}>
          <div className="row">
            <div className="col-12 col-md-8 detail-info-box">
              <div className="category placehold">{this.state.category}</div>
              <h1 className="title text-truncate placehold">{this.state.name}</h1>
              <p className="description placehold">{this.state.description}</p>
              {!!this.state.unitsAvailable && this.state.unitsAvailable < 5 &&
                <div className="units-available text-danger">Just {this.state.unitsAvailable.toLocaleString()} left!</div>
              }
              {this.state.ipfsHash &&
                <div className="ipfs link-container">
                  <a href={origin.ipfsService.gatewayUrlForHash(this.state.ipfsHash)} target="_blank">
                    View on IPFS<img src="images/carat-blue.svg" className="carat" alt="right carat" />
                  </a>
                </div>
              }
              <div className="debug">
                <li>IPFS: {this.state.ipfsHash}</li>
                <li>Seller: {this.state.sellerAddress}</li>
                <li>Units: {this.state.unitsAvailable}</li>
              </div>
              {!this.state.loading && this.state.purchases.length > 0 &&
                <Fragment>
                  <hr />
                  <h2>Purchases</h2>
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: '200px' }}>Status</th>
                        <th scope="col">TxHash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.purchases.map(({ address, stage }) =>
                        <tr key={address}>
                          <td>{stage.replace("_"," ")}</td>
                          <td className="text-truncate"><Link to={`/purchases/${address}`}>{address}</Link></td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Fragment>
              }
            </div>
            <div className="col-12 col-md-4">
              <div className="buy-box placehold">
                {this.state.price &&
                  <div className="price d-flex justify-content-between">
                    <div>Price</div>
                    <div className="text-right">
                      {Number(this.state.price).toLocaleString(undefined, {minimumFractionDigits: 3})} ETH
                    </div>
                  </div>
                }
                {/* Via Matt 4/5/2018: Hold off on allowing buyers to select quantity > 1 */}
                {/* <div className="quantity d-flex justify-content-between">
                                  <div>Quantity</div>
                                  <div className="text-right">
                                    {Number(1).toLocaleString()}
                                  </div>
                                </div>
                                <div className="total-price d-flex justify-content-between">
                                  <div>Total Price</div>
                                  <div className="price text-right">
                                    {Number(price).toLocaleString(undefined, {minimumFractionDigits: 3})} ETH
                                  </div>
                                </div> */}
                {!this.state.loading &&
                  <div>
                    {(this.state.address) && (
                      (this.state.unitsAvailable > 0) ?
                        <button
                          className="btn btn-primary"
                          onClick={this.handleBuyClicked}
                          disabled={!this.state.address}
                          onMouseDown={e => e.preventDefault()}
                        >
                          Buy Now
                        </button>
                        :
                        <div className="sold-banner">
                          <img src="images/sold-tag.svg" role="presentation" />
                          Sold Out
                        </div>
                      )
                    }
                  </div>
                }
              </div>
              {this.state.sellerAddress && <UserCard title="seller" userAddress={this.state.sellerAddress} />}
            </div>
          </div>
          {!!this.state.reviews.length &&
            <div className="row">
              <div className="col-12 col-md-8">
                <hr />
                <div className="reviews">
                  <h2>Reviews <span className="review-count">57</span></h2>
                  {this.state.reviews.map(r => <Review key={r._id} review={r} />)}
                  <a href="#" className="reviews-link" onClick={() => alert('To Do')}>Read More<img src="images/carat-blue.svg" className="down carat" alt="down carat" /></a>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    )
  }
}

const mapDispatchToProps = dispatch => ({
  showAlert: (msg) => dispatch(showAlert(msg))
})

export default connect(undefined, mapDispatchToProps)(ListingsDetail)
