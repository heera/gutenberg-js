/**
 * External dependencies
 */
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { Component, createRef } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { DotTip } from '@wordpress/nux';

/**
 * Internal dependencies
 */
import PublishButtonLabel from './label';
export class PostPublishButton extends Component {
  constructor (props) {
    super(props);
    this.buttonNode = createRef();
  }
  componentDidMount () {
    if (this.props.focusOnMount) {
      this.buttonNode.current.focus();
    }
  }

  render () {
    const {
      forceIsDirty,
      forceIsSaving,
      hasPublishAction,
      isBeingScheduled,
      isOpen,
      isPostSavingLocked,
      isPublishable,
      isPublished,
      isSaveable,
      isSaving,
      isToggle,
      onSave,
      onStatusChange,
      onSubmit = noop,
      onToggle,
      visibility,
    } = this.props;
    const isButtonDisabled =
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			isPostSavingLocked ||
			(! isPublishable && ! forceIsDirty);

    const isToggleDisabled =
			isPublished ||
			isSaving ||
			forceIsSaving ||
			! isSaveable ||
			(! isPublishable && ! forceIsDirty);

    let publishStatus;
    if (! hasPublishAction) {
      publishStatus = 'pending';
    }
    else if (isBeingScheduled) {
      publishStatus = 'future';
    }
    else if (visibility === 'private') {
      publishStatus = 'private';
    }
    else {
      publishStatus = 'publish';
    }

    const onClick = () => {
      onSubmit();
      onStatusChange(publishStatus);
      onSave();
    };

    const buttonProps = {
      'aria-disabled': isButtonDisabled,
      className: 'editor-post-publish-button',
      isBusy: isSaving && isPublished,
      isLarge: true,
      isPrimary: true,
      onClick,
    };

    const toggleProps = {
      'aria-disabled': isToggleDisabled,
      'aria-expanded': isOpen,
      className: 'editor-post-publish-panel__toggle',
      isBusy: isSaving && isPublished,
      isPrimary: true,
      onClick: onToggle,
    };

    const toggleChildren = isBeingScheduled ? __('Schedule…') : __('Publish…');
    const buttonChildren = <PublishButtonLabel forceIsSaving={ forceIsSaving } />;

    const componentProps = isToggle ? toggleProps : buttonProps;
    const componentChildren = isToggle ? toggleChildren : buttonChildren;
    return (
      <Button
        ref={ this.buttonNode }
        { ...componentProps }
      >
        { componentChildren }
        <DotTip tipId="core/editor.publish">
          { __('Finished writing? That’s great, let’s get this published right now. Just click “Publish” and you’re good to go.') }
        </DotTip>
      </Button>
    );
  }
}

export default compose([
  withSelect(select => {
    const {
      isSavingPost,
      isEditedPostBeingScheduled,
      getEditedPostVisibility,
      isCurrentPostPublished,
      isEditedPostSaveable,
      isEditedPostPublishable,
      isPostSavingLocked,
      getCurrentPost,
      getCurrentPostType,

      // GUTENBERG JS
      getEditorSettings,
    } = select('core/editor');

    // GUTENBERG JS
    const { canPublish } = getEditorSettings();

    return {
      isSaving: isSavingPost(),
      isBeingScheduled: isEditedPostBeingScheduled(),
      visibility: getEditedPostVisibility(),
      isSaveable: isEditedPostSaveable(),
      isPostSavingLocked: isPostSavingLocked(),
      isPublishable: isEditedPostPublishable(),
      isPublished: isCurrentPostPublished(),
      hasPublishAction: get(getCurrentPost(), [ '_links', 'wp:action-publish' ], false),
      postType: getCurrentPostType(),

      // GUTENBERG
      canPublish,
    };
  }),
  withDispatch(dispatch => {
    const { editPost, savePost } = dispatch('core/editor');
    return {
      onStatusChange: status => editPost({ status }),
      onSave: savePost,
    };
  }),

  // GUTENBERG JS
  // added the ifCondition to enable/disable
  // the publish button according 'canPublish' setting
  ifCondition(({ canPublish }) => canPublish),
])(PostPublishButton);
