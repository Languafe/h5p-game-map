import CallbackQueue from '@services/callback-queue';
import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Jukebox from '@services/jukebox';

/**
 * Mixin containing handlers for stage.
 */
export default class MainHandlersStage {
  /**
   * Handle stage clicked.
   *
   * @param {string} id Id of stage that was clicked on.
   */
  handleStageClicked(id) {
    this.stages.disable();
    window.clearTimeout(this.stageAttentionSeekerTimeout);

    const stage = this.stages.getStage(id);
    const exercise = this.exercises.getExercise(id);

    const remainingTime = exercise.getRemainingTime();
    if (typeof remainingTime === 'number') {
      this.exerciseScreen.setTime(remainingTime);
    }

    this.exerciseScreen.setH5PContent(exercise.getDOM());
    this.exerciseScreen.setTitle(stage.getLabel());
    Jukebox.stopGroup('default');
    this.exerciseScreen.show();
    this.exercises.start(id);

    if (Globals.get('params').audio.backgroundMusic.muteDuringExercise) {
      Jukebox.fade(
        'backgroundMusic', { type: 'out', time: this.musicFadeTime }
      );
    }

    Jukebox.play('openExercise');

    if (!this.isShowingSolutions) {
      // Update context for confusion report contract
      const stageIndex = Globals.get('params').gamemapSteps.gamemap.elements
        .findIndex((element) => element.id === id);
      this.currentStageIndex = stageIndex + 1;
      this.callbacks.onProgressChanged(this.currentStageIndex);
    }

    // Store to restore focus when exercise screen is closed
    this.openExerciseId = id;
    CallbackQueue.setSkippable(false);

    window.requestAnimationFrame(() => {
      Globals.get('resize')();
    });
  }

  /**
   * Handle stage state changed.
   *
   * @param {string} id Id of exercise that was changed.
   * @param {number} state State code.
   */
  handleStageStateChanged(id, state) {
    if (this.isShowingSolutions) {
      return;
    }

    if (this.paths) {
      CallbackQueue.add(() => {
        this.paths.updateState(id, state);
      });
    }

    if (this.stages) {
      this.stages.updateNeighborsState(id, state);

      // Set filters for completed/cleared stages
      const filters = {
        state: [
          Globals.get('states')['completed'],
          Globals.get('states')['cleared']
        ]
      };

      this.toolbar.setStatusContainerStatus('stages', {
        value: this.stages.getCount({ filters: filters }),
        maxValue: this.stages.getCount()
      });
    }
  }

  /**
   * Handle stage focused.
   */
  handleStageFocused() {
    window.setTimeout(() => {
      Globals.get('read')(Dictionary.get('a11y.applicationInstructions'));
    }, 250); // Make sure everything else is read already
  }

  /**
   * Handle stage became active descendant.
   *
   * @param {string} id Stage's id.
   */
  handleStageBecameActiveDescendant(id) {
    this.map?.setActiveDescendant(id);
  }

  /**
   * Handle stage added function to main queue.
   *
   * @param {function} callback Function to add to queue.
   * @param {object} params Parameters for queue.
   */
  handleStageAddedToQueue(callback, params) {
    CallbackQueue.add(callback, params);
  }
}