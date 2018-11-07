import * as cluster from 'cluster';
import { CpuInfo, cpus } from 'os';

class Clusters {
	private cpus: CpuInfo[];
	constructor() {
		this.cpus = cpus();
		this.init();
	}

	init() {
		if (cluster.isMaster) {
			this.cpus.forEach(() => {
				cluster.fork();
				cluster.on('listening', (worker: cluster.Worker) => {
					console.log(`Cluster with id ${worker.process.pid} connected`);
				});

				cluster.on('disconnect', (worker: cluster.Worker) => {
					console.log(`Cluster with id ${worker.process.pid} disconnected`);
				});

				cluster.on('exit', (worker: cluster.Worker) => {
					console.log(`Cluster with id ${worker.process.pid} exited`);
					cluster.fork();
				});

			})
		} else {
			require('./index');
		}
	}
}

export default new Clusters();