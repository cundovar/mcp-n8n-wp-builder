import DiscoveryBriefView from './DiscoveryBriefView';
import SiteArchitectureView from './SiteArchitectureView';
import ContentPlanView from './ContentPlanView';
import DesignPlanView from './DesignPlanView';
import WordPressPlanView from './WordPressPlanView';
import ExecutionPlanView from './ExecutionPlanView';
import GenericArtifactHumanView from './GenericArtifactHumanView';

function ArtifactHumanView({ artifact, showRaw = true }) {
  switch (artifact?.artifact_type) {
    case 'normalized_brief':
    case 'discovery_brief':
      return <DiscoveryBriefView artifact={artifact} showRaw={showRaw} />;
    case 'site_architecture':
      return <SiteArchitectureView artifact={artifact} showRaw={showRaw} />;
    case 'content_plan':
      return <ContentPlanView artifact={artifact} showRaw={showRaw} />;
    case 'design_plan':
      return <DesignPlanView artifact={artifact} showRaw={showRaw} />;
    case 'wordpress_plan':
      return <WordPressPlanView artifact={artifact} showRaw={showRaw} />;
    case 'execution_plan':
    case 'execution_report':
      return <ExecutionPlanView artifact={artifact} showRaw={showRaw} />;
    default:
      return <GenericArtifactHumanView artifact={artifact} showRaw={showRaw} />;
  }
}

export default ArtifactHumanView;
