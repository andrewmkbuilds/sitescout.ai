import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RotateCw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Catches render errors from the routed page so a single crashing page shows a
// recoverable fallback instead of blanking the entire app shell. Key it by
// route pathname in the parent so it resets on navigation.
export default class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Page render error:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
          <div>
            <h2 className="text-lg font-semibold">This page hit an error</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Something went wrong while rendering this page. The rest of the app is still usable — try again or head back to the overview.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.handleReset}>
              <RotateCw className="mr-2 h-4 w-4" /> Try again
            </Button>
            <Button asChild>
              <Link to="/app"><LayoutDashboard className="mr-2 h-4 w-4" /> Back to overview</Link>
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}