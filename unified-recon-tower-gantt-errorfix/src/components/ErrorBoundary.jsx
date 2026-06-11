import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected UI error' };
  }

  componentDidCatch(error, info) {
    // Keep console logging for developers, but never crash the whole app for users.
    console.error('Unified Recon Tower UI error', error, info);
  }

  reset = () => this.setState({ hasError: false, message: '' });

  render() {
    if (this.state.hasError) {
      return <section className="errorState fadeIn">
        <h2>Something went wrong while rendering this view</h2>
        <p>{this.state.message}</p>
        <button className="primaryBtn" onClick={this.reset}>Recover screen</button>
      </section>;
    }
    return this.props.children;
  }
}
