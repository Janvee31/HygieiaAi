import React from 'react';
import { motion } from 'framer-motion';
import { 
  FaRobot, FaCalendarAlt, FaRunning, FaAppleAlt, 
  FaHeartbeat, FaLungs, FaFemale, FaPills, FaFileMedical, FaFlask,
  FaClipboardList, FaFileAlt, FaStethoscope, FaXRay, FaBrain, FaHospital
} from 'react-icons/fa';

interface AgentType {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  subAgents?: AgentType[];
}

interface AgentSelectorProps {
  agents: AgentType[];
  selectedAgent: string;
  onSelectAgent: (agentId: string) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  agents,
  selectedAgent,
  onSelectAgent
}) => {
  const [expandedAgent, setExpandedAgent] = React.useState<string | null>(null);

  const toggleExpandAgent = (agentId: string) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
    } else {
      setExpandedAgent(agentId);
      // Also select the main agent when expanding
      onSelectAgent(agentId);
    }
  };

  return (
    <div className="flex items-center justify-around gap-3 overflow-x-auto pb-2 hide-scrollbar w-full">
      {agents.map((agent) => (
        <div key={agent.id} className="relative">
          <motion.button
            onClick={() => {
              if (agent.subAgents) {
                toggleExpandAgent(agent.id);
              } else {
                onSelectAgent(agent.id);
                setExpandedAgent(null);
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 border border-white/20 ${selectedAgent === agent.id ? 'bg-opacity-20 border-opacity-50' : 'bg-black bg-opacity-20 hover:bg-opacity-30'}`}
            style={{
              backgroundColor: selectedAgent === agent.id ? agent.color : 'rgba(0,0,0,0.2)',
              borderColor: selectedAgent === agent.id ? agent.color : 'transparent',
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-2xl">{agent.icon}</span>
            <span className="text-sm font-medium whitespace-nowrap">{agent.name}</span>
            {agent.subAgents && (
              <span className="ml-1 text-xs">
                {expandedAgent === agent.id ? '▲' : '▼'}
              </span>
            )}
          </motion.button>

          {/* Sub-agents dropdown */}
          {agent.subAgents && expandedAgent === agent.id && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-black bg-opacity-70 backdrop-blur-md border border-white/10 z-10"
            >
              <div className="py-1">
                {agent.subAgents.map(subAgent => (
                  <motion.button
                    key={subAgent.id}
                    onClick={() => {
                      // When selecting a sub-agent, we keep the main agent ID but store the sub-agent type
                      onSelectAgent(agent.id);
                      // We could store the sub-agent ID in a separate state if needed
                    }}
                    className="flex items-center px-3 py-2 w-full text-left hover:bg-opacity-20 transition-colors"
                    style={{
                      color: subAgent.color,
                    }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="mr-2">{subAgent.icon}</span>
                    <span className="text-white/80">{subAgent.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AgentSelector;
