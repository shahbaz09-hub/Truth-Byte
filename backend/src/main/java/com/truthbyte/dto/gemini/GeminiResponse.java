package com.truthbyte.dto.gemini;

import lombok.Data;

import java.util.List;
import java.util.stream.Collectors;

@Data
public class GeminiResponse {
    private List<Candidate> candidates;

    @Data
    public static class Candidate {
        private Content content;
    }

    @Data
    public static class Content {
        private List<Part> parts;
    }

    @Data
    public static class Part {
        private String text;
    }

    public String getExtractedText() {
        if (candidates != null
                && !candidates.isEmpty()
                && candidates.get(0).getContent() != null
                && candidates.get(0).getContent().getParts() != null
                && !candidates.get(0).getContent().getParts().isEmpty()) {
            String combined = candidates.get(0).getContent().getParts().stream()
                    .map(Part::getText)
                    .filter(text -> text != null && !text.isBlank())
                    .collect(Collectors.joining());
            return combined.isBlank() ? null : combined;
        }
        return null;
    }
}
