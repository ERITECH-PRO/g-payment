import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const useAttestations = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const generateWorkCertificate = async (employeeId: string) => {
        setIsGenerating(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/generate-work-certificate`,
                { employeeId },
                {
                    responseType: 'blob',
                }
            );

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attestation-travail-${employeeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Attestation de travail générée avec succès');
        } catch (error) {
            console.error('Error generating work certificate:', error);
            toast.error('Erreur lors de la génération de l\'attestation');
        } finally {
            setIsGenerating(false);
        }
    };

    const generateInternshipCertificate = async (employeeId: string) => {
        setIsGenerating(true);
        try {
            const response = await axios.post(
                `${API_URL}/api/generate-internship-certificate`,
                { employeeId },
                {
                    responseType: 'blob',
                }
            );

            // Create a download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attestation-stage-${employeeId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Attestation de stage générée avec succès');
        } catch (error) {
            console.error('Error generating internship certificate:', error);
            toast.error('Erreur lors de la génération de l\'attestation');
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        generateWorkCertificate,
        generateInternshipCertificate,
        isGenerating,
    };
};
