import Sender from '../modules/Senders/sender.model.js';
import Thread from '../modules/Threads/thread.model.js';

Sender.hasMany(Thread, { foreignKey: 'sender_id', sourceKey: 'id' });
Thread.belongsTo(Sender, { foreignKey: 'sender_id', targetKey: 'id' });

export { Sender, Thread };