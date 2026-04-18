import './styles.css';
import { createLogger } from '@/shared/util/logger';

const log = createLogger('content');
log.info('content script loaded on', location.host);
