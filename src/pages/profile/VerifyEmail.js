import React, { Component } from 'react'

import Modal from 'components/modal'

import origin from '../../services/origin'

class VerifyEmail extends Component {
  constructor() {
    super()
    this.state = { mode: 'email', email: '', code: '' }
  }

  render() {
    return (
      <Modal
        isOpen={this.props.open}
        data-modal="email"
        className="identity"
        handleToggle={this.props.handleToggle}
      >
        <div className="image-container d-flex align-items-center">
          <img src="images/email-icon-dark.svg" role="presentation" />
        </div>
        <form
          onSubmit={async e => {
            e.preventDefault()
            if (this.state.mode === 'email') {
              origin.attestations.emailGenerateCode({
                email: this.state.email
              })
              this.setState({ mode: 'code' })
            } else if (this.state.mode === 'code') {
              let emailAttestation = await origin.attestations.emailVerify({
                email: this.state.email,
                code: this.state.code,
                wallet: this.props.wallet
              })
              this.props.onSuccess(emailAttestation)
            }
          }}
        >
          <h2>Verify Your Email Address</h2>
          {this.state.mode === 'email'
            ? this.renderEmailForm()
            : this.renderCodeForm()}
          <div className="button-container">
            <a
              className="btn btn-clear"
              data-modal="email"
              onClick={this.props.handleToggle}
            >
              Cancel
            </a>
            <button type="submit" className="btn btn-clear">
              Continue
            </button>
          </div>
        </form>
      </Modal>
    )
  }

  renderEmailForm() {
    return (
      <div className="form-group">
        <label htmlFor="email">Enter your email below</label>
        <input
          type="email"
          className="form-control"
          id="email"
          name="email"
          value={this.state.email}
          onChange={e =>
            this.setState({ email: e.currentTarget.value })
          }
          placeholder="Valid email address"
          required
        />
      </div>
    )
  }

  renderCodeForm() {
    return (
      <div className="form-group">
        <label htmlFor="emailVerificationCode">
          Enter the code we sent you below
        </label>
        <input
          className="form-control"
          id="emailVerificationCode"
          name="phone-verification-code"
          value={this.state.code}
          onChange={e => this.setState({ code: e.currentTarget.value })}
          placeholder="Verification code"
          pattern="[a-zA-Z0-9]{6}"
          title="6-Character Verification Code"
          required
        />
      </div>
    )
  }
}

export default VerifyEmail
