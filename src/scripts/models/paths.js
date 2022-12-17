import Globals from '@services/globals';
import Util from '@services/util';
import Path from '@components/map/path';

export default class Paths {

  constructor(params = {}) {
    this.params = Util.extend({
      elements: {},
      hidden: false
    }, params);

    this.paths = this.buildPaths(this.params.elements);
  }

  getDOMs() {
    return this.paths.map((path) => path.getDOM());
  }

  /**
   * Build paths.
   *
   * @param {object} elements Elements with stages.
   * @returns {Path[]} Paths.
   */
  buildPaths(elements) {
    const paths = [];

    if (!Object.keys(elements ?? {}).length) {
      return []; // No elements/stages, so no paths to compute
    }

    const pathsCreated = [];
    for (let index in elements) {
      (elements[index].neighbors || []).forEach((neighbor) => {
        if (
          !pathsCreated.includes(`${index}-${neighbor}`) &&
          !pathsCreated.includes(`${neighbor}-${index}`)
        ) {
          paths.push(new Path({
            fromId: elements[index].id,
            toId: elements[neighbor].id,
            telemetryFrom: elements[index].telemetry,
            telemetryTo: elements[neighbor].telemetry,
            index: pathsCreated.length,
            visuals: this.params.visuals,
            hidden: this.params.hidden
          }));
          pathsCreated.push(`${index}-${neighbor}`);
        }
      });
    }

    return paths;
  }

  /**
   * Update.
   *
   * @param {object} [params={}] Parameters.
   * @param {object} [params.mapSize] Map size.
   */
  update(params = {}) {
    this.paths.forEach((path) => {
      path.resize({ mapSize: params.mapSize });
    });
  }

  /**
   * Update state.
   *
   * @param {string} id Id of stage/exercise that was updated.
   * @param {number} state If of state that was changed to.
   */
  updateState(id, state) {
    const globalParams = Globals.get('params');

    if (globalParams.behaviour.roaming === 'free') {
      return;
    }

    const affectedPaths = this.paths.filter((path) => {
      const stageIds = path.getStageIds();
      return (stageIds.from === id || stageIds.to === id);
    });

    if (
      state === Globals.get('states')['open'] &&
      globalParams.behaviour.displayPaths &&
      globalParams.behaviour.fog !== '0'
    ) {
      affectedPaths.forEach((path) => {
        path.show();
      });
    }

    if (state === Globals.get('states')['cleared']) {
      affectedPaths.forEach((path) => {
        path.setState('cleared');
        path.show();
      });
    }
  }
}