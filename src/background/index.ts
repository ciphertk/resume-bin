import { attachRuntimeListener } from '@/shared/messaging';
import { registerAllHandlers } from './handlers';
import { createLogger } from '@/shared/util/logger';

const log = createLogger('background');

registerAllHandlers();
attachRuntimeListener();

log.info('service worker started');
