import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';
import { env } from '~/env';

export function GoogleAnalytics() {
  const gaId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  if (!gaId) {
    return null;
  }
  
  return <NextGoogleAnalytics gaId={gaId} />;
}