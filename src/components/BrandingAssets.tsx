import { useState, type ImgHTMLAttributes } from 'react';
import { COFFEE_URL } from '../models/appMetadata';
import { Tooltip } from './Tooltip';

export function SafeImage(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <img {...props} onError={() => setFailed(true)} />;
}

export function CoffeeSupportLink() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <Tooltip content="Support the project">
      <a
        className="coffee-link"
        href={COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Dubcodes on Buy Me a Coffee"
      >
        <img src="/assets/coffee_logo.png" alt="" onError={() => setFailed(true)} />
      </a>
    </Tooltip>
  );
}
