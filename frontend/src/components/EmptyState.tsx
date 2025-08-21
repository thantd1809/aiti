import { Heading } from "@chakra-ui/react";

export function EmptyState(props: { onChoice: (question: string) => any }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Heading
        fontSize={{ base: "xl", md: "3xl" }}
        fontWeight="medium"
        mb={1}
        color="black"
      >
        In-house AI concierge service
      </Heading>
    </div>
  );
}
