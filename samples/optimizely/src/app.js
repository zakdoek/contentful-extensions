import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import useMethods from 'use-methods';
import tokens from '@contentful/forma-36-tokens';
import StatusBar from './components/status-bar';
import ReferencesSection from './components/references-section';
import ExperimentSection from './components/experiment-section';
import VariationsSection from './components/variations-section';
import SectionSplitter from './components/section-splitter';
import { Status } from './constants';
import prepareReferenceInfo from './reference-info';

import { SDKContext, ContentTypesContext, ReferenceInfoContext } from './all-context';

const styles = {
  root: css({
    margin: tokens.spacingXl
  })
};

const methods = state => {
  return {
    setInitialData({ experiments, contentTypes, referenceInfo }) {
      state.experiments = experiments;
      state.contentTypes = contentTypes;
      state.referenceInfo = referenceInfo;
      state.loaded = true;
    },
    setError(message) {
      state.error = message;
    },
    setExperimentId(id) {
      state.experimentId = id;
    },
    setVariations(variations) {
      state.variations = variations;
    }
  };
};

const getInitialValue = sdk => ({
  loaded: false,
  error: false,
  experiments: [],
  contentTypes: [],
  meta: sdk.entry.fields.meta.getValue() || {},
  variations: sdk.entry.fields.variations.getValue() || [],
  experimentId: sdk.entry.fields.experimentId.getValue()
});

const fetchInitialData = async (sdk, client) => {
  const { space, ids, locales } = sdk;

  const [contentTypesRes, entriesRes, experiments] = await Promise.all([
    space.getContentTypes(),
    space.getEntries({ links_to_entry: ids.entry, skip: 0, limit: 1000 }),
    client.getExperiments()
  ]);

  return {
    experiments,
    contentTypes: contentTypesRes.items,
    referenceInfo: prepareReferenceInfo({
      contentTypes: contentTypesRes.items,
      entries: entriesRes.items,
      variationContainerId: ids.entry,
      variationContainerContentTypeId: ids.contentType,
      defaultLocale: locales.default
    })
  };
};

export default function App(props) {
  const [state, actions] = useMethods(methods, getInitialValue(props.sdk));

  useEffect(() => {
    fetchInitialData(props.sdk, props.client)
      .then(data => {
        actions.setInitialData(data);
        return data;
      })
      .catch(() => {
        actions.setError('Unable to load initial data');
      });
  }, []);

  useEffect(() => {
    const unsubsribeExperimentChange = props.sdk.entry.fields.experimentId.onValueChanged(data => {
      actions.setExperimentId(data);
    });
    const unsubsribeVariationsChange = props.sdk.entry.fields.variations.onValueChanged(data => {
      actions.setVariations(data || []);
    });
    return () => {
      unsubsribeExperimentChange();
      unsubsribeVariationsChange();
    };
  }, []);

  const getExperiment = () => {
    return state.experiments.find(experiment => experiment.id.toString() === state.experimentId);
  };

  const getStatus = experiment => {
    if (!experiment) {
      return Status.SelectExperiment;
    }
    return Status.AddContent;
  };

  const onChangeExperiment = experimentId => {
    props.sdk.entry.fields.experimentId.setValue(experimentId);
  };

  const onLinkVariation = async () => {
    const data = await props.sdk.dialogs.selectSingleEntry(
      props.sdk.locales.defaultLocale,
      // todo: for some reason it doesn't work properly - need to investigate
      state.referenceInfo.linkContentTypes
    );

    const values = props.sdk.entry.fields.variations.getValue() || [];
    values.push({
      sys: {
        type: 'Link',
        id: data.sys.id,
        linkType: 'Entry'
      }
    });

    props.sdk.entry.fields.variations.setValue(values);
  };

  const onOpenVariation = id => {
    props.sdk.navigator.openEntry(id, { slideIn: true });
  };

  const onCreateVariation = async (index, contentTypeId) => {
    const { entity } = await props.sdk.navigator.openNewEntry(contentTypeId, {
      slideIn: true
    });

    const values = props.sdk.entry.fields.variations.getValue() || [];
    values.push({
      sys: {
        type: 'Link',
        id: entity.sys.id,
        linkType: 'Entry'
      }
    });
    props.sdk.entry.fields.variations.setValue(values);
  };

  const onRemoveVariation = id => {
    let values = props.sdk.entry.fields.variations.getValue() || [];
    values = values.filter(item => item.sys.id !== id);
    props.sdk.entry.fields.variations.setValue(values);
  };

  const experiment = getExperiment();
  const status = getStatus(experiment);

  return (
    <SDKContext.Provider value={props.sdk}>
      <ContentTypesContext.Provider value={state.contentTypes}>
        <ReferenceInfoContext.Provider value={state.referenceInfo}>
          <div className={styles.root}>
            <StatusBar loaded={state.loaded} status={status} />
            <SectionSplitter />
            <ReferencesSection
              loaded={state.loaded}
              references={state.loaded ? state.referenceInfo.references : []}
              sdk={props.sdk}
            />
            <SectionSplitter />
            <ExperimentSection
              loaded={state.loaded}
              disabled={state.variations.length > 0}
              experiments={state.experiments}
              experiment={experiment}
              onChangeExperiment={onChangeExperiment}
            />
            <SectionSplitter />
            <VariationsSection
              loaded={state.loaded}
              contentTypes={state.contentTypes}
              experiment={experiment}
              variations={state.variations}
              onCreateVariation={onCreateVariation}
              onLinkVariation={onLinkVariation}
              onOpenVariation={onOpenVariation}
              onRemoveVariation={onRemoveVariation}
            />
            {/* {this.state.loaded && <IncomingReferences referenceInfo={this.state.referenceInfo} />} */}
          </div>
        </ReferenceInfoContext.Provider>
      </ContentTypesContext.Provider>
    </SDKContext.Provider>
  );
}

const AppTypes = {
  client: PropTypes.any.isRequired,
  sdk: PropTypes.shape({
    space: PropTypes.object.isRequired,
    ids: PropTypes.object.isRequired,
    locales: PropTypes.object.isRequired,
    navigator: PropTypes.shape({
      openEntry: PropTypes.func.isRequired,
      openNewEntry: PropTypes.func.isRequired
    }).isRequired,
    dialogs: PropTypes.shape({
      selectSingleEntry: PropTypes.func.isRequired
    }).isRequired,
    entry: PropTypes.shape({
      fields: PropTypes.shape({
        experimentId: PropTypes.object.isRequired,
        variations: PropTypes.object.isRequired,
        meta: PropTypes.object.isRequired
      }).isRequired
    }).isRequired,
    parameters: PropTypes.shape({
      installation: PropTypes.shape({
        optimizelyProjectId: PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  }).isRequired
};

App.propTypes = AppTypes;
