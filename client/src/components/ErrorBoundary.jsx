// Catches crashes in any screen below it and shows the "Something went wrong" page.
// React needs a class component for this (getDerivedStateFromError / componentDidCatch).
import { Component } from 'react';
import SomethingWentWrong from '../pages/SomethingWentWrong';

export default class ErrorBoundary extends Component {
  state = { error: null };

  // A child crashed -> remember the error, so render() shows the error page
  static getDerivedStateFromError(error) {
    return { error };
  }

  // Log it (a real app could send it to an error tracker here)
  componentDidCatch(error, info) {
    console.error('UI crashed:', error, info.componentStack);
  }

  // "Try again": clear the error and render the screens again
  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return <SomethingWentWrong error={this.state.error} onReset={this.reset} />;
    return this.props.children;
  }
}
